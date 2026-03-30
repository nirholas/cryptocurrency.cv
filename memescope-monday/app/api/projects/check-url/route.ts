import { NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { project } from "@/drizzle/db/schema"
import { eq } from "drizzle-orm"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const url = searchParams.get("url")

    if (!url) {
      return NextResponse.json({ error: "URL parameter is required" }, { status: 400 })
    }

    // Normaliser l'URL pour la comparaison
    const normalizedUrl = url.toLowerCase().replace(/\/$/, "")

    // Vérifier si l'URL existe déjà
    const [existingProject] = await db
      .select({ id: project.id, launchStatus: project.launchStatus })
      .from(project)
      .where(eq(project.websiteUrl, normalizedUrl))

    // If no project found, the URL is available
    if (!existingProject) {
      return NextResponse.json({ exists: false })
    }

    // If a project exists but is in PAYMENT_PENDING or PAYMENT_FAILED,
    // we consider the URL as available to allow re-submission
    if (
      existingProject.launchStatus === "payment_pending" ||
      existingProject.launchStatus === "payment_failed"
    ) {
      return NextResponse.json({ exists: false })
    }

    // In all other cases, the URL is considered taken
    return NextResponse.json({ exists: true })
  } catch (error) {
    console.error("Error checking URL:", error)
    return NextResponse.json({ error: "Failed to check URL" }, { status: 500 })
  }
}
