/**
 * Next.js Middleware
 * Handles internationalization routing with next-intl
 *
 * This middleware was accidentally deleted in a refactor. Without it,
 * next-intl's `localePrefix: 'as-needed'` mode cannot rewrite locale-free
 * URLs (e.g. /coin/apecoin) to their locale-prefixed counterparts
 * (e.g. /en/coin/apecoin), causing 500 errors on every page.
 */

import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing } from "@/i18n/navigation";

// Create the next-intl middleware
const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files, API routes, and special paths
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/static/") ||
    pathname.startsWith("/icons/") ||
    pathname.startsWith("/splash/") ||
    pathname.startsWith("/.well-known/") ||
    pathname === "/manifest.json" ||
    pathname === "/sw.js" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname === "/feed.xml" ||
    pathname === "/favicon.ico" ||
    pathname === "/favicon.svg" ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.endsWith(".ico")
  ) {
    return NextResponse.next();
  }

  // Handle i18n routing
  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except static files and API routes
  matcher: [
    // Match all pathnames except static files
    "/((?!api|_next|static|icons|splash|.*\\..*).*)",
    // Match root
    "/",
  ],
};
