"use client";
// AiView — main shell with violet→purple gradient header + 2-col layout (chat left, insights right).
import * as React from "react";
import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { useApp } from "@/store/app-store";
import { AiChat } from "./ai-chat";
import { AiInsights } from "./ai-insights";

export type AiContextSnapshot = {
  students: number;
  teachers: number;
  classes: number;
  funds: number;
  fundsByType?: Record<string, number>;
  hifzRate: number;
  hifzAvgQuality: number;
  attendanceRate: number;
  feesCollected30d: number;
  feesPending: number;
  hijriToday: string;
  zakatEligibleStudents: number;
};

export function AiView() {
  const { t, dir } = useApp();
  const [ctx, setCtx] = React.useState<AiContextSnapshot | null>(null);

  return (
    <div className="space-y-6" dir={dir()}>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20 ring-1 ring-white/30">
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.15]"
              aria-hidden="true"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                backgroundSize: "40px 40px",
                backgroundRepeat: "repeat",
              }}
            />
            <Bot className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("ai.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("ai.subtitle")}</p>
          </div>
        </div>
        {ctx && (
          <div className="flex items-center gap-2 rounded-full bg-violet-100 dark:bg-violet-950/40 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-300">
            <span className="size-1.5 rounded-full bg-violet-500 animate-pulse" />
            <span dir="auto">{ctx.hijriToday}</span>
          </div>
        )}
      </div>

      {/* 2-col layout: chat (60%) | insights (40%) */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="lg:col-span-3"
        >
          <AiChat onContextUpdate={setCtx} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
          className="lg:col-span-2"
        >
          <AiInsights context={ctx} />
        </motion.div>
      </div>
    </div>
  );
}
