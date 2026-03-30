"use client"

import { useEffect, useRef } from "react"

import { Turnstile } from "@marsidev/react-turnstile"

interface TurnstileCaptchaProps {
  onVerify: (token: string) => void
}

export function TurnstileCaptcha({ onVerify }: TurnstileCaptchaProps) {
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY
  const ref = useRef(null)

  const isDisabled = !siteKey || siteKey === "placeholder" || process.env.NODE_ENV === "development"

  // When Turnstile is not configured, auto-pass so forms aren't blocked
  useEffect(() => {
    if (isDisabled) {
      onVerify("turnstile-disabled")
    }
  }, [isDisabled, onVerify])

  if (isDisabled) return null

  return (
    <div className="flex justify-center">
      <Turnstile
        ref={ref}
        siteKey={siteKey!}
        onSuccess={onVerify}
        onError={() => console.error("Turnstile verification error")}
        onExpire={() => console.warn("Turnstile verification expired")}
        options={{
          size: "normal",
        }}
      />
    </div>
  )
}
