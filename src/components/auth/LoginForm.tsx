/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const BASE_URL = typeof window !== "undefined" ? window.location.origin : "";

const ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Magic link is invalid. Please request a new one.",
  invalid_or_expired: "This link has expired or already been used. Please request a new one.",
  server_error: "Something went wrong. Please try again.",
};

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name: name || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Failed to send magic link");
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage("Network error. Please try again.");
    }
  }

  if (status === "sent") {
    return (
      <div className="w-full max-w-md mx-auto p-8">
        <div className="rounded-2xl border border-border bg-card p-8 text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-3">Check your email</h1>
          <p className="text-muted-foreground mb-6">
            We sent a sign-in link to{" "}
            <span className="font-semibold text-foreground">{email}</span>.
            <br />
            Click the link to sign in — it expires in 15 minutes.
          </p>
          <button
            onClick={() => setStatus("idle")}
            className="text-sm text-blue-500 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-8">
      <div className="rounded-2xl border border-border bg-card p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">Sign in to your dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email to receive a magic sign-in link.
            <br />
            No password needed.
          </p>
        </div>

        {errorParam && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-6">
            {ERROR_MESSAGES[errorParam] || "An error occurred. Please try again."}
          </div>
        )}

        {status === "error" && errorMessage && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 rounded-lg p-3 text-sm mb-6">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-1.5">
              Email address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1.5">
              Name <span className="text-muted-foreground">(optional)</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={status === "loading" || !email}
            className="w-full py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 text-white font-semibold text-sm transition-colors"
          >
            {status === "loading" ? "Sending..." : "Send magic link"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            By signing in, you agree to our{" "}
            <a href="/en/terms" className="text-blue-500 hover:underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/en/privacy" className="text-blue-500 hover:underline">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>

      <div className="mt-6 text-center">
        <p className="text-sm text-muted-foreground">
          New to Crypto Vision News?{" "}
          <a href="/en/pricing" className="text-blue-500 hover:underline font-medium">
            View pricing plans
          </a>
        </p>
      </div>
    </div>
  );
}
