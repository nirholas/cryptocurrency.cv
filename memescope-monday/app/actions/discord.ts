"use server"

import { headers } from "next/headers"

import { launchType as LaunchTypeEnum } from "@/drizzle/db/schema"
import { z } from "zod"

import { auth } from "@/lib/auth"
import { notifyDiscordLaunch as sendRealDiscordLaunchNotification } from "@/lib/discord-notification"

const LaunchTypeZodEnum = z.enum(Object.values(LaunchTypeEnum) as [string, ...string[]], {
  errorMap: () => ({ message: "Invalid launch type specified." }),
})

const DiscordNotificationSchema = z.object({
  projectName: z
    .string()
    .min(1, "Project name cannot be empty.")
    .max(100, "Project name cannot exceed 100 characters."),
  launchDate: z.string().min(1, "Launch date cannot be empty."),
  launchType: LaunchTypeZodEnum,
  websiteUrl: z.string().url("Invalid website URL format.").min(1, "Website URL cannot be empty."),
  projectUrl: z.string().url("Invalid project URL format.").min(1, "Project URL cannot be empty."),
})

export async function notifyDiscordLaunch(
  projectName: string,
  launchDate: string,
  launchType: string,
  websiteUrl: string,
  projectUrl: string,
) {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })

  if (!session?.user?.id) {
    console.error("[DiscordNotify] Unauthorized attempt: No active session.")
    return { success: false, error: "Unauthorized: User not authenticated." }
  }

  const authenticatedUserId = session.user.id

  const validation = DiscordNotificationSchema.safeParse({
    projectName,
    launchDate,
    launchType,
    websiteUrl,
    projectUrl,
  })

  if (!validation.success) {
    console.error(
      "[DiscordNotify] Invalid data for notification:",
      JSON.stringify(validation.error.flatten()),
    )
    return {
      success: false,
      error: "Invalid data provided for Discord notification.",
      details: validation.error.flatten().fieldErrors,
    }
  }

  const validatedData = validation.data

  try {
    console.log(
      `[DiscordNotify] Sending notification for project: ${validatedData.projectName}, Type: ${validatedData.launchType}, Initiated by User ID: ${authenticatedUserId}`,
    )
    const result = await sendRealDiscordLaunchNotification(
      validatedData.projectName,
      validatedData.launchDate,
      validatedData.launchType,
      validatedData.websiteUrl,
      validatedData.projectUrl,
      authenticatedUserId,
    )
    if (result) {
      console.log(
        `[DiscordNotify] Successfully sent notification for project: ${validatedData.projectName}`,
      )
      return { success: true }
    } else {
      console.warn(
        `[DiscordNotify] sendRealDiscordLaunchNotification returned false for project: ${validatedData.projectName}`,
      )
      return { success: false, error: "Notification sending function indicated failure." }
    }
  } catch (error) {
    console.error(
      `[DiscordNotify] Error sending Discord launch notification for project: ${validatedData.projectName}, User ID: ${authenticatedUserId}:`,
      error,
    )
    return {
      success: false,
      error: "Internal server error during Discord notification.",
    }
  }
}
