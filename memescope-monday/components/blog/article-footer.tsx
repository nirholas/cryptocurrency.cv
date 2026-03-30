"use client"

import { Facebook, Linkedin, Twitter } from "lucide-react"

export function ArticleFooter() {
  const shareOnTwitter = () => {
    const url = window.location.href
    const text = document.title
    window.open(
      `https://x.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
      "_blank",
    )
  }

  const shareOnLinkedIn = () => {
    const url = window.location.href
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
    )
  }

  const shareOnFacebook = () => {
    const url = window.location.href
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank")
  }

  return (
    <footer className="border-border mt-12 space-y-6 border-t pt-8">
      {/* Share Buttons */}
      <div className="flex items-center justify-between">
        <div className="text-foreground text-sm font-medium">Share this article</div>
        <div className="flex items-center gap-2">
          <button
            onClick={shareOnTwitter}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-lg p-2 text-sm transition-colors"
            aria-label="Share on Twitter"
          >
            <Twitter className="h-4 w-4" />
          </button>
          <button
            onClick={shareOnLinkedIn}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-lg p-2 text-sm transition-colors"
            aria-label="Share on LinkedIn"
          >
            <Linkedin className="h-4 w-4" />
          </button>
          <button
            onClick={shareOnFacebook}
            className="text-muted-foreground hover:bg-muted hover:text-foreground flex items-center gap-2 rounded-lg p-2 text-sm transition-colors"
            aria-label="Share on Facebook"
          >
            <Facebook className="h-4 w-4" />
          </button>
        </div>
      </div>
    </footer>
  )
}
