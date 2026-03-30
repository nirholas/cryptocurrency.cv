"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"

import { RiArrowDownSLine, RiChat3Line } from "@remixicon/react"

import { cn } from "@/lib/utils"

interface TrollboxProps {
  projectId: string
  isAuthenticated: boolean
}

const adjectives = [
  "Ultra",
  "Mega",
  "Alpha",
  "Sigma",
  "Based",
  "Diamond",
  "Moon",
  "Degen",
  "Crypto",
  "Turbo",
  "Hyper",
  "Super",
  "Astro",
  "Pixel",
  "Neon",
]

const nouns = [
  "Ape",
  "Lion",
  "Wolf",
  "Whale",
  "Bull",
  "Shark",
  "Eagle",
  "Titan",
  "King",
  "Chad",
  "Doge",
  "Pepe",
  "Punk",
  "Bear",
  "Fox",
]

function generateUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)]
  const noun = nouns[Math.floor(Math.random() * nouns.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}

interface TrollboxMessage {
  id: string
  username: string
  message: string
  timestamp: Date
}

export function Trollbox({ projectId, isAuthenticated }: TrollboxProps) {
  const [open, setOpen] = useState(true)
  const [messages, setMessages] = useState<TrollboxMessage[]>([])
  const [input, setInput] = useState("")
  const [sending, setSending] = useState(false)
  const router = useRouter()

  const username = useMemo(() => generateUsername(), [])

  // Load messages
  useEffect(() => {
    async function loadMessages() {
      try {
        const res = await fetch(`/api/trollbox/${projectId}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages || [])
        }
      } catch {
        // silently fail
      }
    }
    loadMessages()
  }, [projectId])

  const handleSend = async () => {
    if (!input.trim()) return

    if (!isAuthenticated) {
      router.push("/sign-in")
      return
    }

    setSending(true)
    try {
      const res = await fetch(`/api/trollbox/${projectId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input.trim(), username }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages((prev) => [...prev, data.message])
        setInput("")
      }
    } catch {
      // silently fail
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="border-border overflow-hidden rounded-lg border">
      <button
        onClick={() => setOpen(!open)}
        className="hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <RiChat3Line className="text-muted-foreground h-4 w-4" />
          <span className="text-sm font-semibold">Trollbox</span>
          <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
            {messages.length}
          </span>
        </div>
        <RiArrowDownSLine
          className={cn("text-muted-foreground h-5 w-5 transition-transform", open && "rotate-180")}
        />
      </button>

      {open && (
        <div className="border-border border-t">
          {/* Messages area */}
          <div className="max-h-[300px] min-h-[120px] overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="flex min-h-[100px] items-center justify-center">
                <p className="text-muted-foreground text-sm">
                  No messages yet. Start the conversation!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className="text-sm">
                    <span className="font-bold">{msg.username}</span>
                    <span className="text-muted-foreground ml-2 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    <p className="text-foreground mt-0.5">{msg.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-border border-t px-4 py-3">
            <p className="text-muted-foreground mb-2 text-xs">
              Chatting as <span className="font-bold">{username}</span>
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Say something degen..."
                className="border-border bg-background placeholder:text-muted-foreground flex-1 rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={sending}
              />
              <button
                onClick={handleSend}
                disabled={sending || !input.trim()}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
