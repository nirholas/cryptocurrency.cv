"use client";

import { usePathname } from "next/navigation";

interface Session {
  userId: string;
  email: string;
  name?: string;
  role: string;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: "📊" },
  { href: "/dashboard/keys", label: "API Keys", icon: "🔑" },
  { href: "/dashboard/usage", label: "Usage", icon: "📈" },
  { href: "/dashboard/settings", label: "Settings", icon: "⚙️" },
];

export default function DashboardSidebar({ session }: { session: Session }) {
  const pathname = usePathname();

  // Extract locale-relative path
  const segments = pathname.split("/");
  const localePath = "/" + segments.slice(2).join("/");

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
              localePath === item.href ||
              (item.href !== "/dashboard" && localePath.startsWith(item.href));

            return (
              <li key={item.href}>
                <a
                  href={`/${segments[1]}${item.href}`}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                    isActive
                      ? "bg-blue-500/10 text-blue-500 font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
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
            <a
              href="/en/docs"
              className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
              target="_blank"
            >
              API Documentation
            </a>
          </li>
          <li>
            <a
              href="/en/widgets"
              className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
            >
              Widget Builder
            </a>
          </li>
          <li>
            <a
              href="/en/pricing"
              className="text-sm text-muted-foreground hover:text-blue-500 transition-colors"
            >
              Pricing Plans
            </a>
          </li>
        </ul>
      </div>
    </aside>
  );
}
