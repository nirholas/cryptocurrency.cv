import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"

import { db } from "@/drizzle/db"
import { trollboxMessage } from "@/drizzle/db/schema"
import { desc, eq } from "drizzle-orm"

import { auth } from "@/lib/auth"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const { projectId } = await params

  const messages = await db
    .select()
    .from(trollboxMessage)
    .where(eq(trollboxMessage.projectId, projectId))
    .orderBy(desc(trollboxMessage.createdAt))
    .limit(50)

  return NextResponse.json({
    messages: messages.reverse().map((m) => ({
      id: m.id,
      username: m.username,
      message: m.message,
      timestamp: m.createdAt,
    })),
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> },
) {
  const session = await auth.api.getSession({
    headers: await headers(),
  })

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  const { projectId } = await params
  const body = await request.json()
  const { message, username } = body

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 })
  }

  if (message.trim().length > 500) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 })
  }

  const id = crypto.randomUUID()
  const now = new Date()

  await db.insert(trollboxMessage).values({
    id,
    projectId,
    userId: session.user.id,
    username: username || "Anon",
    message: message.trim(),
    createdAt: now,
  })

  return NextResponse.json({
    message: {
      id,
      username: username || "Anon",
      message: message.trim(),
      timestamp: now,
    },
  })
}
