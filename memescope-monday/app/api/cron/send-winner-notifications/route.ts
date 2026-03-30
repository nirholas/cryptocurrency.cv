import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { launchStatus, project, user } from "@/drizzle/db/schema"
import { endOfDay, startOfDay, subDays } from "date-fns"
import { and, eq, gte, inArray, lt } from "drizzle-orm"

import { sendWinnerBadgeEmail } from "@/lib/transactional-emails"

const API_KEY = process.env.CRON_API_KEY

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const providedKey = authHeader?.replace("Bearer ", "")

    if (!API_KEY || providedKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const yesterday = subDays(startOfDay(now), 1)
    const endOfYesterday = endOfDay(yesterday)

    console.log(`[${now.toISOString()}] Starting cron: Send Winner Notifications`)
    console.log(
      `Looking for winners from: ${yesterday.toISOString()} to ${endOfYesterday.toISOString()}`,
    )

    const winners = await db
      .select({
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        projectRanking: project.dailyRanking,
        projectCreatorId: project.createdBy,
        projectLaunchType: project.launchType,
      })
      .from(project)
      .where(
        and(
          eq(project.launchStatus, launchStatus.LAUNCHED),
          inArray(project.dailyRanking, [1, 2, 3]),
          gte(project.scheduledLaunchDate, yesterday),
          lt(project.scheduledLaunchDate, startOfDay(now)),
        ),
      )
      .execute()

    if (winners.length === 0) {
      console.log("No new winners found to notify.")
      return NextResponse.json({ message: "No new winners to notify." })
    }

    console.log(`Found ${winners.length} winning projects to notify.`)
    let emailsSentCount = 0
    let emailsFailedCount = 0

    for (const winner of winners) {
      if (!winner.projectCreatorId || !winner.projectRanking) {
        console.warn(`Skipping project ${winner.projectName} due to missing creator ID or ranking.`)
        continue
      }

      const projectCreator = await db
        .select({
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, winner.projectCreatorId))
        .limit(1)
        .then((res) => res[0])

      if (!projectCreator || !projectCreator.email) {
        console.warn(
          `User not found or email missing for creator ID ${winner.projectCreatorId} of project ${winner.projectName}.`,
        )
        emailsFailedCount++
        continue
      }

      try {
        console.log(
          `Sending winner email to ${projectCreator.email} for project ${winner.projectName}`,
        )

        await sendWinnerBadgeEmail({
          user: { email: projectCreator.email, name: projectCreator.name },
          projectName: winner.projectName,
          projectSlug: winner.projectSlug,
          ranking: winner.projectRanking,
          launchType: winner.projectLaunchType,
        })
        emailsSentCount++
      } catch (error) {
        emailsFailedCount++
        console.error(
          `Failed to send winner email for project ${winner.projectName} to ${projectCreator.email}:`,
          error,
        )
      }
    }

    console.log(`[${now.toISOString()}] Winner notification process completed.`)
    console.log(`- Emails sent successfully: ${emailsSentCount}`)
    console.log(`- Emails failed: ${emailsFailedCount}`)

    return NextResponse.json({
      message: "Winner notification process completed.",
      details: {
        winnersFound: winners.length,
        emailsSent: emailsSentCount,
        emailsFailed: emailsFailedCount,
      },
    })
  } catch (error) {
    console.error("Error in send-winner-notifications cron:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
