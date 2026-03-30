/* eslint-disable @next/next/no-img-element */

/* eslint-disable react/no-unescaped-entities */
import Link from "next/link"

import { CopyButton } from "@/components/badges/copy-button"

export const metadata = {
  title: "Attribution Badges - Memescope Monday",
  description: "Official attribution badges for Memescope Monday License compliance",
}

export default function AttributionBadgesPage() {
  const lightBadgeCode = `<a href="https://open-launch.com" target="_blank" title="Powered by Open-Launch">
  <img 
    src="https://open-launch.com/images/badges/powered-by-light.svg" 
    alt="Powered by Open-Launch" 
    width="150" 
    height="44"
  />
</a>`

  const darkBadgeCode = `<a href="https://open-launch.com" target="_blank" title="Powered by Open-Launch">
  <img 
    src="https://open-launch.com/images/badges/powered-by-dark.svg" 
    alt="Powered by Open-Launch" 
    width="150" 
    height="44"
  />
</a>`

  return (
    <div className="bg-secondary/20 py-8 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="bg-background rounded-xl border p-6 shadow-sm sm:p-8 dark:border-zinc-800">
          <h1 className="mb-6 text-2xl font-bold sm:text-3xl">Attribution Badges</h1>
          <p className="text-muted-foreground mb-6">
            Official badges for Memescope Monday License attribution requirements
          </p>

          <div className="space-y-8">
            <section>
              <h2 className="mb-4 text-xl font-semibold">License Attribution - MANDATORY</h2>
              <div className="mb-4 rounded-r-lg border-l-4 border-red-500 bg-red-50 p-4 dark:bg-red-950/20">
                <p className="mb-2 font-medium text-red-800 dark:text-red-200">
                  ⚠️ MANDATORY REQUIREMENT
                </p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  If you use Memescope Monday, you MUST display a visual badge on ALL pages of your
                  website (preferably in the footer). Text-only attribution is NOT sufficient.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">Official Badges</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="mb-3 text-lg font-medium">Light Theme Badge</h3>
                  <div className="mb-4 flex items-center gap-4">
                    <img
                      src="/images/badges/powered-by-light.svg"
                      alt="Powered by Memescope Monday - Light Theme"
                      className="h-11 w-auto rounded"
                    />
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">HTML Code:</p>
                      <CopyButton code={lightBadgeCode} />
                    </div>
                    <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
                      <code>{lightBadgeCode}</code>
                    </pre>
                  </div>
                </div>

                <div>
                  <h3 className="mb-3 text-lg font-medium">Dark Theme Badge</h3>
                  <div className="mb-4 flex items-center gap-4">
                    <img
                      src="/images/badges/powered-by-dark.svg"
                      alt="Powered by Memescope Monday - Dark Theme"
                      className="h-11 w-auto rounded"
                    />
                  </div>
                  <div className="bg-secondary rounded-lg p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-sm font-medium">HTML Code:</p>
                      <CopyButton code={darkBadgeCode} />
                    </div>
                    <pre className="bg-background overflow-x-auto rounded p-3 text-xs">
                      <code>{darkBadgeCode}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-xl font-semibold">MANDATORY Technical Requirements</h2>
              <ul className="list-disc space-y-2 pl-6">
                <li>
                  <strong>Placement:</strong> Badge must be present on ALL pages of your website
                  (recommended: footer)
                </li>
                <li>
                  <strong>Link:</strong> Must link to "https://open-launch.com"
                </li>
                <li>
                  <strong>Link type:</strong> Must be a dofollow link (do NOT add rel="nofollow"
                  attribute)
                </li>
                <li>
                  <strong>Visibility:</strong> Badge must be clearly visible and easily accessible
                </li>
                <li>
                  <strong>Minimum dimensions:</strong> 150×44 pixels (do not reduce size)
                </li>
                <li>
                  <strong>Prohibitions:</strong> Badge must NOT be hidden, obstructed, or made
                  transparent
                </li>
                <li>
                  <strong>Required format:</strong> Visual badge only - text alone is NOT accepted
                </li>
              </ul>
              <div className="mt-4 rounded-r-lg border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950/20">
                <p className="mb-2 font-medium text-blue-800 dark:text-blue-200">
                  💡 Implementation Recommendation
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  Place the badge in your global footer so it appears automatically on all pages
                  without additional code modifications.
                </p>
              </div>
            </section>
          </div>

          <div className="mt-8 border-t pt-6 dark:border-zinc-800">
            <div className="flex flex-wrap gap-4">
              <Link href="/legal/terms" className="text-primary hover:underline">
                View Terms of Service
              </Link>
              <Link href="/legal" className="text-primary hover:underline">
                Back to Legal Information
              </Link>
              <Link href="/" className="text-primary hover:underline">
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
