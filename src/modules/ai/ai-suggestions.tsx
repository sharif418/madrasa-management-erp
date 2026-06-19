"use client";
// AiSuggestions — chips of suggested questions above the chat input.
import { Sparkles } from "lucide-react";
import { useApp } from "@/store/app-store";

export function AiSuggestions({
  onPick,
  disabled,
}: {
  onPick: (q: string) => void;
  disabled?: boolean;
}) {
  const { t } = useApp();
  const items = [
    { key: "ai.q1", tone: "from-emerald-500/10 to-teal-500/10 text-emerald-700 dark:text-emerald-300 hover:from-emerald-500/20 hover:to-teal-500/20 border-emerald-200/60 dark:border-emerald-900/40" },
    { key: "ai.q2", tone: "from-amber-500/10 to-orange-500/10 text-amber-700 dark:text-amber-300 hover:from-amber-500/20 hover:to-orange-500/20 border-amber-200/60 dark:border-amber-900/40" },
    { key: "ai.q3", tone: "from-sky-500/10 to-cyan-500/10 text-sky-700 dark:text-sky-300 hover:from-sky-500/20 hover:to-cyan-500/20 border-sky-200/60 dark:border-sky-900/40" },
    { key: "ai.q4", tone: "from-rose-500/10 to-pink-500/10 text-rose-700 dark:text-rose-300 hover:from-rose-500/20 hover:to-pink-500/20 border-rose-200/60 dark:border-rose-900/40" },
  ];

  return (
    <div className="border-t border-violet-200/60 dark:border-violet-900/40 bg-gradient-to-r from-violet-50/50 to-purple-50/50 dark:from-violet-950/20 dark:to-purple-950/20 px-3 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        <Sparkles className="size-3 shrink-0 text-violet-500" />
        {items.map((s) => (
          <button
            key={s.key}
            type="button"
            disabled={disabled}
            onClick={() => onPick(t(s.key))}
            className={`shrink-0 rounded-full border bg-gradient-to-r ${s.tone} px-3 py-1 text-[11px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {t(s.key)}
          </button>
        ))}
      </div>
    </div>
  );
}
