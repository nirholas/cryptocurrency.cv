"use client"

import { useEffect } from "react"

export function SmoothScrollInit() {
  useEffect(() => {
    // Smooth scroll behavior for hash links
    const handleHashClick = (e: Event) => {
      const target = e.target as HTMLAnchorElement
      if (target.hash) {
        e.preventDefault()
        const element = document.querySelector(target.hash)
        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          })
        }
      }
    }

    // Add smooth scroll behavior to all hash links
    const hashLinks = document.querySelectorAll('a[href^="#"]')
    hashLinks.forEach((link) => {
      link.addEventListener("click", handleHashClick)
    })

    return () => {
      hashLinks.forEach((link) => {
        link.removeEventListener("click", handleHashClick)
      })
    }
  }, [])

  return null
}
