"use client";

import { useState, type FormEvent } from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export default function FooterNewsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setStatus("success");
        setEmail("");
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-sm text-emerald-500" role="status" aria-live="polite">
        <CheckCircle className="h-4 w-4" aria-hidden="true" />
        <span>Subscribed!</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
        <input
          id="footer-newsletter-email"
          type="email"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (status === "error") setStatus("idle"); }}
          placeholder="your@email.com"
          required
          aria-required="true"
          aria-invalid={status === "error"}
          aria-describedby={status === "error" ? "footer-newsletter-error" : undefined}
          className={cn(
            "h-9 flex-1 min-w-0 rounded-md border border-border bg-(--color-surface) px-3 text-sm",
            "focus:outline-none focus:ring-1 focus:ring-accent",
            status === "error" && "border-red-500"
          )}
        />
        <Button type="submit" size="sm" variant="primary" disabled={status === "loading"} aria-label={status === "loading" ? "Subscribing..." : "Subscribe to newsletter"}>
          {status === "loading" ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : "Subscribe"}
        </Button>
      </div>
      {status === "error" && (
        <p id="footer-newsletter-error" className="text-xs text-red-500" role="alert">
          Subscription failed. Please try again.
        </p>
      )}
    </form>
  );
}
