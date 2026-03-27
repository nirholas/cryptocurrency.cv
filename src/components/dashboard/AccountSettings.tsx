/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useEffect, useState } from "react";
import { Link, useRouter } from "@/i18n/navigation";

interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string | null;
}

export default function AccountSettings() {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch {
        // Fail silently
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, []);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
    } catch {
      setLoggingOut(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Settings</h1>
        </div>
        <div className="rounded-xl border border-border bg-card p-6 space-y-4 animate-pulse">
          <div className="h-4 w-32 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
          <div className="h-4 w-24 bg-muted rounded" />
          <div className="h-10 w-full bg-muted rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-1">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your account settings.
        </p>
      </div>

      {/* Account Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Account</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Email
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm">{user?.email}</span>
              {user?.emailVerified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-500/10 text-green-400">
                  Verified
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Name
            </label>
            <span className="text-sm">{user?.name || "—"}</span>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Role
            </label>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-500/10 text-blue-400 capitalize">
              {user?.role}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Member since
            </label>
            <span className="text-sm">
              {user?.createdAt
                ? new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </span>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Last login
            </label>
            <span className="text-sm">
              {user?.lastLoginAt
                ? new Date(user.lastLoginAt).toLocaleString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          </div>
        </div>
      </div>

      {/* Payment Info */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold mb-4">Billing</h2>
        <div className="text-sm text-muted-foreground space-y-3">
          <p>
            This platform uses{" "}
            <span className="text-blue-500 font-semibold">
              x402 micropayments
            </span>{" "}
            — pay per request with USDC on Base.
          </p>
          <p>No credit card. No subscriptions. Pay only for what you use.</p>
          <div className="mt-4 p-4 rounded-lg bg-muted/30 border border-border">
            <div className="text-xs font-semibold text-muted-foreground mb-2">
              Payment Details
            </div>
            <div className="space-y-1 text-xs">
              <div>
                <span className="text-muted-foreground">Network:</span>{" "}
                <span>Base (EIP-155:8453)</span>
              </div>
              <div>
                <span className="text-muted-foreground">Currency:</span>{" "}
                <span>USDC</span>
              </div>
              <div>
                <span className="text-muted-foreground">Per request:</span>{" "}
                <span>$0.001</span>
              </div>
            </div>
          </div>
          <Link
            href="/pricing"
            className="inline-block mt-2 text-blue-500 hover:underline text-sm font-medium"
          >
            View all pricing plans →
          </Link>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-500/20 bg-card p-6">
        <h2 className="text-lg font-semibold mb-4 text-red-400">Session</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Sign out of your account on this device.
        </p>
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          className="px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {loggingOut ? "Signing out..." : "Sign Out"}
        </button>
      </div>
    </div>
  );
}
