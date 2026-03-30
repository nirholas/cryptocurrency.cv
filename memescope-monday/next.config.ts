import type { NextConfig } from "next"

import createMDX from "@next/mdx"
import remarkGfm from "remark-gfm"

const nextConfig: NextConfig = {
  /* config options here */

  // Configuration pour MDX
  pageExtensions: ["js", "jsx", "md", "mdx", "ts", "tsx"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "yt3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "yt3.ggpht.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "designmodo.com",
      },
      ...(process.env.NEXT_PUBLIC_UPLOADTHING_URL
        ? [
            {
              protocol: "https" as const,
              hostname: process.env.NEXT_PUBLIC_UPLOADTHING_URL,
            },
          ]
        : []),
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "nexty.dev",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "ipfs.io",
      },
      {
        protocol: "https",
        hostname: "cf-ipfs.com",
      },
      {
        protocol: "https",
        hostname: "cdn.dexscreener.com",
      },
      {
        protocol: "https",
        hostname: "pump.fun",
      },
      {
        protocol: "https",
        hostname: "i.imgur.com",
      },
      {
        protocol: "https",
        hostname: "nftstorage.link",
      },
      {
        protocol: "https",
        hostname: "arweave.net",
      },
      {
        protocol: "https",
        hostname: "gateway.pinata.cloud",
      },
      {
        protocol: "https",
        hostname: "assets.coingecko.com",
      },
      {
        protocol: "https",
        hostname: "coin-images.coingecko.com",
      },
    ],
  },
}

const withMDX = createMDX({
  options: {
    remarkPlugins: [remarkGfm],
  },
})

// Combine MDX and Next.js config
export default withMDX(nextConfig)


