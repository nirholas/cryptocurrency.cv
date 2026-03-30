"use client"

import { useState } from "react"

import { RiCheckLine, RiFileCopyLine } from "@remixicon/react"

interface CopyAddressProps {
  address: string
}

export function CopyAddress({ address }: CopyAddressProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-foreground group flex items-center gap-1.5 font-mono text-sm font-medium transition-colors hover:text-blue-600 dark:hover:text-blue-400"
      title="Click to copy full address"
    >
      <span>
        {address.slice(0, 6)}...{address.slice(-4)}
      </span>
      {copied ? (
        <RiCheckLine className="h-3.5 w-3.5 text-green-500" />
      ) : (
        <RiFileCopyLine className="text-muted-foreground h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
      )}
    </button>
  )
}
