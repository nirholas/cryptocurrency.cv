/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, type FormEvent } from "react";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function DigestSubscribeForm() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, frequency }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage("You're subscribed! Check your inbox for confirmation.");
        setEmail("");
      } else {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          data.error || "Something went wrong. Please try again."
        );
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/30 p-5 max-w-xl mx-auto">
        <div className="flex items-center justify-center h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/40 shrink-0">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <p className="font-semibold text-sm text-text-primary">
            {message}
          </p>
          <p className="text-xs text-text-tertiary mt-0.5">
            Frequency: {frequency === "daily" ? "Daily" : "Weekly"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-2 mb-4 justify-center">
        <button
          type="button"
          onClick={() => setFrequency("daily")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
            frequency === "daily"
              ? "bg-accent text-white"
              : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
          )}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={() => setFrequency("weekly")}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-colors cursor-pointer",
            frequency === "weekly"
              ? "bg-accent text-white"
              : "bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
          )}
        >
          Weekly
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
      >
        <div className="relative flex-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={cn(
              "w-full h-12 rounded-lg border border-border bg-(--color-surface) pl-10 pr-4 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-accent focus:border-transparent",
              "placeholder:text-text-tertiary"
            )}
          />
        </div>
        <Button
          type="submit"
          variant="primary"
          disabled={status === "loading"}
          className="h-12 px-6"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "Subscribe"
          )}
        </Button>
      </form>

      {status === "error" && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400 text-center">
          {message}
        </p>
      )}

      <p className="mt-3 text-[11px] text-text-tertiary text-center">
        Free forever. No spam. Unsubscribe anytime.
      </p>
    </div>
  );
}
