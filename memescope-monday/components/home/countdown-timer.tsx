"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

function getNextMondayUTC(): Date {
  const now = new Date()
  const utcDay = now.getUTCDay()
  const utcHour = now.getUTCHours()
  let daysUntil: number
  if (utcDay === 1 && utcHour < 10) daysUntil = 0
  else if (utcDay === 1) daysUntil = 7
  else if (utcDay === 0) daysUntil = 1
  else daysUntil = 8 - utcDay
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysUntil, 10, 0, 0, 0),
  )
}

export function CountdownTimer() {
  const [mounted, setMounted] = useState(false)
  const [diff, setDiff] = useState(0)

  useEffect(() => {
    setMounted(true)
    const target = getNextMondayUTC()
    const update = () => setDiff(Math.max(0, target.getTime() - Date.now()))
    update()
    const iv = setInterval(update, 1000)
    return () => clearInterval(iv)
  }, [])

  if (!mounted) return null

  const target = getNextMondayUTC()
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ]
  const dateLabel = `${monthNames[target.getUTCMonth()]} ${target.getUTCDate()}`

  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff / 3600000) % 24)
  const minutes = Math.floor((diff / 60000) % 60)
  const seconds = Math.floor((diff / 1000) % 60)
  const isLive = diff === 0

  if (isLive) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 p-6 text-white shadow-lg">
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 items-center justify-center">
              <span className="absolute h-3 w-3 animate-ping rounded-full bg-white opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <div>
              <h2 className="text-lg font-bold tracking-tight sm:text-xl">
                Memescope Monday is LIVE
              </h2>
              <p className="text-sm text-white/80">Vote for your favorite memecoins now!</p>
            </div>
          </div>
          <Link
            href="/projects/submit"
            className="hidden rounded-lg bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all hover:bg-white/90 hover:shadow-md sm:block"
          >
            Submit Coin
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white shadow-lg sm:p-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-xs font-medium tracking-widest text-white/70 uppercase">
              Next Launch
            </p>
            <h2 className="text-lg font-bold tracking-tight text-white sm:text-xl">
              Memescope Monday — {dateLabel}
            </h2>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
              ◎ Solana
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
              Base
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white/80">
              BNB
            </span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div className="flex gap-3 sm:gap-4">
            {[
              { val: days, label: "days" },
              { val: hours, label: "hrs" },
              { val: minutes, label: "min" },
              { val: seconds, label: "sec" },
            ].map((item, i) => (
              <div key={item.label} className="flex items-center gap-3 sm:gap-4">
                <div className="text-center">
                  <div className="rounded-lg bg-white/15 px-3 py-2 font-mono text-2xl font-bold text-white tabular-nums sm:px-4 sm:text-3xl">
                    {String(item.val).padStart(2, "0")}
                  </div>
                  <span className="mt-1 block text-[10px] font-medium tracking-wider text-white/60 uppercase">
                    {item.label}
                  </span>
                </div>
                {i < 3 && (
                  <span className="mb-4 text-xl font-bold text-white/30 sm:text-2xl">:</span>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/projects/submit"
            className="hidden rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-blue-600 shadow-sm transition-all hover:bg-white/90 hover:shadow-md sm:block"
          >
            Submit Early
          </Link>
        </div>
      </div>
    </div>
  )
}
