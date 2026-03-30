"use client"

import { RiCodeLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

interface ShowCodeProps {
  show: boolean
  onClick: () => void
}

export function ShowCode({ show, onClick }: ShowCodeProps) {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onClick}
      className="ml-2 h-8 px-3 text-xs sm:text-sm"
      aria-label={show ? "Hide code" : "Show code"}
      title={show ? "Hide code" : "Show code"}
      type="button"
    >
      <RiCodeLine className="h-4 w-4" />
    </Button>
  )
}
