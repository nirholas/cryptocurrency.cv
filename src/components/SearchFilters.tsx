"use client";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

const DATE_OPTIONS = [
  { label: "Any time", value: "" },
  { label: "Past hour", value: "1h" },
  { label: "Today", value: "24h" },
  { label: "This week", value: "7d" },
  { label: "This month", value: "30d" },
];

const SORT_OPTIONS = [
  { label: "Relevance", value: "relevance" },
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
];

const CATEGORY_OPTIONS = [
  "All",
  "Bitcoin",
  "Ethereum",
  "DeFi",
  "NFT",
  "Altcoins",
  "Regulation",
  "Markets",
];

export function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page"); // reset pagination on filter change
    router.push(`${pathname}?${next.toString()}`);
  };

  const active = (key: string, value: string) =>
    (params.get(key) ?? "") === value;

  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {/* Date filter */}
      <div className="flex gap-1 flex-wrap">
        {DATE_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("date", opt.value)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active("date", opt.value) ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900" : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {/* Sort */}
      <select
        value={params.get("sort") ?? "relevance"}
        onChange={(e) => update("sort", e.target.value)}
        className="px-3 py-1.5 rounded-full text-sm font-medium bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 border-none outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {/* Category */}
      <div className="flex gap-1 flex-wrap">
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat}
            onClick={() =>
              update("category", cat === "All" ? "" : cat.toLowerCase())
            }
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active("category", cat === "All" ? "" : cat.toLowerCase()) ? "bg-brand-500 text-white" : "bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-600"}`}
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
