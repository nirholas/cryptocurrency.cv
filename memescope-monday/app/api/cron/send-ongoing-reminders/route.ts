import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { launchStatus, project, user } from "@/drizzle/db/schema"
import { endOfDay, startOfDay } from "date-fns"
import { and, eq, gte, lt } from "drizzle-orm"

import { sendLaunchReminderEmail } from "@/lib/transactional-emails"

const API_KEY = process.env.CRON_API_KEY

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    const providedKey = authHeader?.replace("Bearer ", "")

    if (!API_KEY || providedKey !== API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const now = new Date()
    const today = startOfDay(now)
    const endOfToday = endOfDay(now)

    console.log(`[${now.toISOString()}] Starting cron: Send Ongoing Launch Reminders`)
    console.log(
      `Looking for projects ongoing from: ${today.toISOString()} to ${endOfToday.toISOString()}`,
    )

    const ongoingProjects = await db
      .select({
        projectId: project.id,
        projectName: project.name,
        projectSlug: project.slug,
        projectCreatorId: project.createdBy,
      })
      .from(project)
      .where(
        and(
          eq(project.launchStatus, launchStatus.ONGOING),
          gte(project.scheduledLaunchDate, today),
          lt(project.scheduledLaunchDate, endOfToday),
        ),
      )
      .execute()

    if (ongoingProjects.length === 0) {
      console.log("No ongoing projects found to remind.")
      return NextResponse.json({ message: "No ongoing projects to remind." })
    }

    console.log(`Found ${ongoingProjects.length} ongoing projects to remind.`)
    let emailsSentCount = 0
    let emailsFailedCount = 0

    for (const proj of ongoingProjects) {
      if (!proj.projectCreatorId) {
        console.warn(`Skipping project ${proj.projectName} due to missing creator ID.`)
        continue
      }

      const projectCreator = await db
        .select({
          email: user.email,
          name: user.name,
        })
        .from(user)
        .where(eq(user.id, proj.projectCreatorId))
        .limit(1)
        .then((res) => res[0])

      if (!projectCreator || !projectCreator.email) {
        console.warn(
          `User not found or email missing for creator ID ${proj.projectCreatorId} of project ${proj.projectName}.`,
        )
        emailsFailedCount++
        continue
      }

      try {
        console.log(
          `Sending launch reminder email to ${projectCreator.email} for project ${proj.projectName}`,
        )

        await sendLaunchReminderEmail({
          user: { email: projectCreator.email, name: projectCreator.name },
          projectName: proj.projectName,
          projectSlug: proj.projectSlug,
        })
        emailsSentCount++
      } catch (error) {
        emailsFailedCount++
        console.error(
          `Failed to send launch reminder email for project ${proj.projectName} to ${projectCreator.email}:`,
          error,
        )
      }
    }

    console.log(`[${now.toISOString()}] Launch reminder process completed.`)
    console.log(`- Emails sent successfully: ${emailsSentCount}`)
    console.log(`- Emails failed: ${emailsFailedCount}`)

    return NextResponse.json({
      message: "Launch reminder process completed.",
      details: {
        projectsFound: ongoingProjects.length,
        emailsSent: emailsSentCount,
        emailsFailed: emailsFailedCount,
      },
    })
  } catch (error) {
    console.error("Error in send-ongoing-reminders cron:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
