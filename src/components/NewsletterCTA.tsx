/**
 * @copyright 2024-2026 nirholas. All rights reserved.
 * @license SPDX-License-Identifier: SEE LICENSE IN LICENSE
 * @see https://github.com/nirholas/free-crypto-news
 */

"use client";

import { useState, type FormEvent } from "react";
import {
  Mail,
  CheckCircle,
  Loader2,
  Zap,
  Shield,
  Clock,
  Sparkles,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const INTEREST_TAGS = [
  { id: "bitcoin", labelKey: "bitcoin", emoji: "₿" },
  { id: "ethereum", labelKey: "ethereum", emoji: "Ξ" },
  { id: "defi", labelKey: "defi", emoji: "🔄" },
  { id: "nft", labelKey: "nfts", emoji: "🎨" },
  { id: "regulation", labelKey: "regulation", emoji: "⚖️" },
  { id: "altcoins", labelKey: "altcoins", emoji: "🪙" },
] as const;

const PERKS = [
  { icon: Zap, textKey: "breakingFirst" },
  { icon: Clock, textKey: "dailyRecap" },
  { icon: Shield, textKey: "noSpam" },
] as const;

export default function NewsletterCTA() {
  const t = useTranslations("newsletter");
  const [email, setEmail] = useState("");
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const toggleTag = (id: string) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          interests: Array.from(selectedTags),
        }),
      });

      if (res.ok) {
        setStatus("success");
        setMessage(t("successMessage"));
        setEmail("");
      } else {
        await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(t("errorMessage"));
      }
    } catch {
      setStatus("error");
      setMessage(t("networkError"));
    }
  };

  return (
    <section className="border-b border-border">
      <div className="container-main py-10 lg:py-14">
        <div
          className={cn(
            "relative overflow-hidden rounded-2xl",
            "bg-gradient-to-br from-accent via-[color-mix(in_srgb,var(--color-accent),#6366f1_40%)] to-[color-mix(in_srgb,var(--color-accent),#000_30%)]"
          )}
        >
          {/* Animated gradient orbs */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-20 -right-20 w-60 h-60 rounded-full bg-white/10 blur-3xl animate-[float_8s_ease-in-out_infinite]" />
            <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-white/5 blur-3xl animate-[float_12s_ease-in-out_infinite_reverse]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/5 blur-2xl animate-[float_6s_ease-in-out_infinite_2s]" />
          </div>

          {/* Dot pattern */}
          <div className="absolute inset-0 opacity-[0.07]" style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }} />

          <div className="relative z-10 p-8 md:p-12 lg:p-16">
            <div className="max-w-3xl mx-auto">
              {/* Two-column on desktop */}
              <div className="grid md:grid-cols-[1fr_auto] gap-8 items-center">
                {/* Left: Content */}
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1 text-xs font-medium text-white mb-4">
                    <Sparkles className="h-3 w-3" />
                    {t("freeForever")}
                  </div>

                  <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold font-serif text-white mb-3 leading-tight">
                    {t("heading")}
                  </h2>

                  <p className="text-white/75 text-sm md:text-base mb-5 max-w-md">
                    {t("description")}
                  </p>

                  {/* Perks */}
                  <div className="flex flex-wrap gap-x-5 gap-y-2 mb-6">
                    {PERKS.map((perk) => {
                      const Icon = perk.icon;
                      return (
                        <span key={perk.textKey} className="flex items-center gap-1.5 text-xs text-white/70">
                          <Icon className="h-3.5 w-3.5 text-white/50" />
                          {t(perk.textKey)}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Feature highlights (desktop) */}
                <div className="hidden md:flex flex-col gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-5">
                  {PERKS.map((perk) => {
                    const Icon = perk.icon;
                    return (
                      <span key={perk.textKey} className="flex items-center gap-2 text-sm text-white/80">
                        <Icon className="h-4 w-4 text-white/60" />
                        {t(perk.textKey)}
                      </span>
                    );
                  })}
                </div>
              </div>

              {status === "success" ? (
                <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-xl py-4 px-6 max-w-lg animate-[fadeSlideIn_0.3s_ease-out]">
                  <div className="flex items-center justify-center h-10 w-10 rounded-full bg-emerald-500/20">
                    <CheckCircle className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white text-sm">{message}</p>
                    {selectedTags.size > 0 && (
                      <p className="text-xs text-white/60 mt-0.5">
                        {t("personalizedFor")} {Array.from(selectedTags).join(", ")}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Interest tags */}
                  <div className="mb-4">
                    <p className="text-xs text-white/50 mb-2">
                      {t("personalize")}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {INTEREST_TAGS.map((tag) => (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all cursor-pointer",
                            selectedTags.has(tag.id)
                              ? "bg-white text-accent shadow-md scale-105"
                              : "bg-white/10 text-white/80 hover:bg-white/20"
                          )}
                        >
                          <span>{tag.emoji}</span>
                          {t(tag.labelKey)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Email form */}
                  <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-lg">
                    <div className="relative flex-1">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                        className={cn(
                          "w-full h-12 rounded-xl border-0 bg-white/15 pl-10 pr-4 text-white placeholder:text-white/40",
                          "focus:outline-none focus:ring-2 focus:ring-white/40 backdrop-blur-sm text-sm"
                        )}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={status === "loading"}
                      className="h-12 px-6 bg-white text-accent hover:bg-white/90 font-bold shadow-lg rounded-xl text-sm"
                    >
                      {status === "loading" ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          {t("subscribe")}
                          <Sparkles className="h-3.5 w-3.5 ml-1.5" />
                        </>
                      )}
                    </Button>
                  </form>

                  {status === "error" && (
                    <p className="mt-3 text-sm text-red-200">{message}</p>
                  )}
                </>
              )}

              <p className="mt-4 text-[11px] text-white/30">
                {t("privacyNote")}
              </p>
            </div>
          </div>

          <style jsx>{`
            @keyframes float {
              0%, 100% { transform: translate(0, 0) scale(1); }
              33% { transform: translate(10px, -15px) scale(1.05); }
              66% { transform: translate(-5px, 10px) scale(0.95); }
            }
            @keyframes fadeSlideIn {
              from { opacity: 0; transform: translateY(8px); }
              to { opacity: 1; transform: translateY(0); }
            }
          `}</style>
        </div>
      </div>
    </section>
  );
}
