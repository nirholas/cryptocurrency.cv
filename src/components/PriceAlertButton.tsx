"use client";
import { useState, useEffect } from "react";

interface Alert {
  coinId: string;
  targetPrice: number;
  direction: "above" | "below";
}

function getAlerts(): Alert[] {
  try {
    return JSON.parse(localStorage.getItem("price_alerts") ?? "[]");
  } catch {
    return [];
  }
}
function saveAlerts(alerts: Alert[]) {
  localStorage.setItem("price_alerts", JSON.stringify(alerts));
}

export function PriceAlertButton({
  coinId,
  currentPrice,
}: {
  coinId: string;
  currentPrice: number;
}) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState("");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [saved, setSaved] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    setHasAlert(getAlerts().some((a) => a.coinId === coinId));
  }, [coinId]);

  const save = () => {
    const price = parseFloat(target);
    if (isNaN(price) || price <= 0) return;
    const alerts = getAlerts().filter((a) => a.coinId !== coinId);
    alerts.push({ coinId, targetPrice: price, direction });
    saveAlerts(alerts);
    setHasAlert(true);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setOpen(false);
    }, 1500);
  };

  const remove = () => {
    saveAlerts(getAlerts().filter((a) => a.coinId !== coinId));
    setHasAlert(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${hasAlert ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-slate-600"}`}
      >
        🔔 {hasAlert ? "Alert set" : "Set alert"}
      </button>
      {open && (
        <div className="absolute top-full mt-2 left-0 z-20 w-64 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-xl p-4">
          <p className="text-xs text-gray-500 dark:text-slate-400 mb-3">
            Current: ${currentPrice.toLocaleString()}
          </p>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as "above" | "below")}
            className="w-full mb-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white"
          >
            <option value="above">Alert when price goes above</option>
            <option value="below">Alert when price goes below</option>
          </select>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder={`e.g. ${(currentPrice * 1.1).toFixed(2)}`}
            className="w-full mb-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-sm text-gray-900 dark:text-white"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              className="flex-1 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg text-sm font-semibold"
            >
              {saved ? "✓ Saved!" : "Save"}
            </button>
            {hasAlert && (
              <button
                onClick={remove}
                className="px-3 py-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
