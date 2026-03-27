/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { Link, usePathname } from "@/i18n/navigation";

interface Session {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

const NAV_ITEMS = [
  { href: "/dashboard" as const, label: "Overview", icon: "📊" },
  { href: "/dashboard/keys" as const, label: "API Keys", icon: "🔑" },
  { href: "/dashboard/usage" as const, label: "Usage", icon: "📈" },
  { href: "/dashboard/settings" as const, label: "Settings", icon: "⚙️" },
];

export default function DashboardSidebar({ session }: { session: Session }) {
  const pathname = usePathname();

  return (
    <aside className="space-y-4">
      {/* User card */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold text-sm">
            {(session.name || session.email)[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-semibold text-sm truncate">
              {session.name || "Developer"}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {session.email}
            </div>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-border">
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-500 capitalize">
            {session.role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="rounded-xl border border-border bg-card p-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-blue-500 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Quick links */}
      <div className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
          Resources
        </h3>
        <ul className="space-y-2">
          <li>
            <Link
              href="/docs"
              className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
              target="_blank"
            >
              API Documentation
            </Link>
          </li>
          <li>
            <Link
              href="/widgets"
              className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
            >
              Widget Builder
            </Link>
          </li>
          <li>
            <Link
              href="/pricing"
              className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
            >
              Pricing Plans
            </Link>
          </li>
        </ul>
      </div>
    </aside>
  );
}
