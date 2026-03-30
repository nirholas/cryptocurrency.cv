import type { Metadata } from "next"
import { Outfit as FontHeading, Inter as FontSans } from "next/font/google"

import PlausibleProvider from "next-plausible"
import { Toaster } from "sonner"

import Footer from "@/components/layout/footer"
import Nav from "@/components/layout/nav"
import { ThemeProvider } from "@/components/theme/theme-provider"

import "./globals.css"

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontHeading = FontHeading({
  subsets: ["latin"],
  variable: "--font-heading",
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_URL || "https://memescopemonday.com"),
  title: "Memescope Monday - Discover the Hottest Memecoins",
  description:
    "Memescope Monday is the ultimate memecoin directory. Discover, submit, and vote on the hottest memecoins across Solana, Base, and BNB Chain every Monday at 10 AM UTC.",
  openGraph: {
    title: "Memescope Monday - Discover the Hottest Memecoins",
    description:
      "The ultimate memecoin directory. Discover, submit, and vote on the hottest memecoins across Solana, Base, and BNB Chain.",
    url: process.env.NEXT_PUBLIC_URL,
    siteName: "Memescope Monday",
    images: [
      {
        url: "og.png",
        width: 1200,
        height: 630,
        alt: "Memescope Monday - Discover the Hottest Memecoins",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Memescope Monday - Discover the Hottest Memecoins",
    description:
      "Memescope Monday is the ultimate memecoin directory. Discover, submit, and vote on the hottest memecoins across Solana, Base, and BNB Chain.",
    images: ["og.png"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <PlausibleProvider
          domain="open-launch.com"
          customDomain="https://plausible.dailypings.com"
          selfHosted={true}
          trackOutboundLinks={true}
          scriptProps={{
            src: "https://plausible.dailypings.com/js/script.js",
          }}
          enabled={process.env.NODE_ENV === "production"}
        />
      </head>
      <body
        className={`font-sans antialiased ${fontSans.variable} ${fontHeading.variable} sm:overflow-y-scroll`}
        suppressHydrationWarning
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-dvh flex-col">
            <Nav />
            <main className="flex-grow">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <Toaster />
      </body>
    </html>
  )
}
