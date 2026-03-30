import Image from "next/image"
import Link from "next/link"

import { ExternalLink, Megaphone } from "lucide-react"

import { cn } from "@/lib/utils"

interface SponsorCardProps {
  name?: string
  description?: string
  url?: string
  imageUrl?: string
  icon?: React.ReactNode
  className?: string
  variant?: "default" | "announce"
}

export function SponsorCard({
  name,
  description,
  url,
  imageUrl,
  icon,
  className,
  variant = "default",
}: SponsorCardProps) {
  // Valeurs par défaut pour le variant announce
  const announceDefaults = {
    name: "Become a Sponsor",
    description: "Get your brand featured here",
    url: "/sponsors",
    icon: <Megaphone size={20} className="text-primary" />,
  }

  const finalProps =
    variant === "announce"
      ? {
          name: name || announceDefaults.name,
          description: description || announceDefaults.description,
          url: url || announceDefaults.url,
          icon: icon || announceDefaults.icon,
        }
      : { name: name!, description: description!, url: url!, icon, imageUrl }

  const isInternal = finalProps.url.startsWith("/")

  return (
    <Link
      href={finalProps.url}
      target={isInternal ? undefined : "_blank"}
      rel={isInternal ? undefined : "noopener"}
      className={cn(
        "bg-secondary/70 hover:bg-secondary border-primary block rounded-md border-l-4 px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-colors",
        className,
      )}
    >
      <div className="flex items-center gap-2">
        {finalProps.icon ? (
          <div className="bg-muted/30 flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg border dark:border-white/10">
            {finalProps.icon}
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${finalProps.name} logo`}
            width={48}
            height={48}
            className="flex-shrink-0 rounded-lg"
            unoptimized
          />
        ) : null}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate text-sm font-semibold">
            {finalProps.name}
            {!isInternal && (
              <ExternalLink size={12} className="text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-muted-foreground truncate text-xs">{finalProps.description}</p>
        </div>
      </div>
    </Link>
  )
}
