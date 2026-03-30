"use client"

import { useState } from "react"

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"

import { Button } from "@/components/ui/button"

interface CopyButtonProps {
  code: string
}

export function CopyButton({ code }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCopy}
      className="h-8 px-3 text-xs sm:text-sm"
    >
      {copied ? (
        <>
          <RiCheckLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Copied!
        </>
      ) : (
        <>
          <RiFileCopyLine className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          Copy
        </>
      )}
    </Button>
  )
}
