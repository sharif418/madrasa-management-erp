// AI Insights — auto-generated smart recommendations using z-ai-web-dev-sdk.
// Returns an array of { type, title, description, action? } insights.
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized } from "@/lib/api";
import { gatherAiContext } from "@/lib/ai-context";
import ZAI from "z-ai-web-dev-sdk";

type InsightType = "positive" | "warning" | "info";
type Insight = {
  type: InsightType;
  title: string;
  description: string;
  action?: string;
};

const VALID: InsightType[] = ["positive", "warning", "info"];

function buildInsightsPrompt(ctxJson: string): string {
  return `You are "Mufakkir" (مفكر), an AI assistant analyzing a madrasa's data to surface smart insights.

Below is a JSON snapshot of the madrasa's real data:
${ctxJson}

Generate 3 to 5 short, actionable insights for the madrasa administrator. Each insight should:
- Be specific to the data above (quote real numbers, percentages, fund balances, counts).
- Have a clear type: "positive" (something going well), "warning" (something needing attention), or "info" (useful observation).
- Include a short "title" (5-8 words).
- Include a concise "description" (1-2 sentences, max ~40 words).
- Optionally include an "action" (a single short recommendation, max ~12 words).

THEMATIC GUIDANCE
- For Hifz: use Sabak / Sabaq Para / Dhor terminology. If avgQuality is below 4, suggest more Dhor (revision). If records30d is low, suggest increasing Sabak frequency.
- For Zakat: if fundsByType.zakat > 0 and students.zakatEligible > 0, suggest Tamlik distribution to eligible students.
- For attendance: if rate7d < 80%, investigate causes. Mention Friday drop if relevant.
- For fees: if feesPending > 0 or overdue, suggest follow-up.
- For finance: comment on fund health. Encourage Shariah-compliant (Lillah/Waqf) fundraising if low.
- For events: mention upcoming events if any.

LANGUAGE
- Default to Bengali (bn). Use Bengali for all insights unless explicitly asked otherwise.
- Keep Islamic-appropriate tone.

OUTPUT FORMAT — STRICT JSON ONLY (no markdown, no prose)
Return a JSON object: { "insights": [ { "type": "...", "title": "...", "description": "...", "action": "..." }, ... ] }

Example:
{ "insights": [
  { "type": "warning", "title": "হিফজ মান কম", "description": "গত ৩০ দিনে গড় হিফজ কোয়ালিটি ৩.২/৫।", "action": "ধর (revision) সংখ্যা বাড়ান।" }
] }`;
}

function parseInsights(raw: string): Insight[] {
  // Strip markdown code fences if present
  let s = raw.trim();
  if (s.startsWith("```")) {
    s = s.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  }
  // Find the first { and last }
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first === -1 || last === -1) return [];
  const jsonStr = s.slice(first, last + 1);
  try {
    const obj = JSON.parse(jsonStr);
    const arr = Array.isArray(obj?.insights) ? obj.insights : Array.isArray(obj) ? obj : [];
    const out: Insight[] = [];
    for (const item of arr) {
      if (!item || typeof item !== "object") continue;
      const type = VALID.includes(item.type) ? item.type : "info";
      const title = String(item.title || "").trim().slice(0, 120);
      const description = String(item.description || "").trim().slice(0, 400);
      if (!title || !description) continue;
      const action = item.action ? String(item.action).trim().slice(0, 200) : undefined;
      out.push({ type, title, description, action });
    }
    return out.slice(0, 5);
  } catch {
    return [];
  }
}

// Fallback rule-based insights in case the LLM fails
function fallbackInsights(ctxJson: string): Insight[] {
  try {
    const ctx = JSON.parse(ctxJson);
    const out: Insight[] = [];
    if (ctx.hifz.avgQuality > 0 && ctx.hifz.avgQuality < 4) {
      out.push({
        type: "warning",
        title: "Hifz quality below target",
        description: `Average Hifz quality over 30 days is ${ctx.hifz.avgQuality}/5. Quality should be 4+ for proper retention.`,
        action: "Increase Dhor (revision) sessions for weak students.",
      });
    }
    if (ctx.funds.byType?.zakat > 0 && ctx.students.zakatEligible > 0) {
      out.push({
        type: "info",
        title: "Zakat distribution pending",
        description: `${ctx.students.zakatEligible} students are Zakat-eligible and ৳${ctx.funds.byType.zakat} is available in the Zakat fund.`,
        action: "Consider Tamlik distribution to eligible students.",
      });
    }
    if (ctx.attendance.rate7d < 80) {
      out.push({
        type: "warning",
        title: "Low attendance rate",
        description: `7-day attendance rate is ${ctx.attendance.rate7d}%. Below the 80% threshold.`,
        action: "Investigate causes and follow up with guardians.",
      });
    }
    if (ctx.fees.pending > 0) {
      out.push({
        type: "warning",
        title: "Pending fees",
        description: `৳${ctx.fees.pending} in fees is pending. Follow up with guardians to ensure timely collection.`,
      });
    }
    if (out.length === 0) {
      out.push({
        type: "positive",
        title: "Operations on track",
        description: "All key metrics are within healthy ranges. Continue current practices and monitor trends.",
      });
    }
    return out.slice(0, 5);
  } catch {
    return [{
      type: "info",
      title: "Insights unavailable",
      description: "AI insights could not be generated at this time. Please try refreshing later.",
    }];
  }
}

export async function GET(_req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const ctx = await gatherAiContext(session, "bn");
  const ctxJson = JSON.stringify(ctx);
  const prompt = buildInsightsPrompt(ctxJson);

  let insights: Insight[] = [];
  try {
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: prompt },
        { role: "user", content: "Please analyze the madrasa data above and generate 3-5 smart insights in Bengali. Return strictly valid JSON only." },
      ],
      thinking: { type: "disabled" },
    });
    const raw = response?.choices?.[0]?.message?.content || "";
    insights = parseInsights(raw);
    if (insights.length === 0) insights = fallbackInsights(ctxJson);
  } catch (e) {
    console.error("[ai/insights] LLM error:", e);
    insights = fallbackInsights(ctxJson);
  }

  return ok({
    insights,
    context: {
      students: ctx.students.total,
      teachers: ctx.teachers.total,
      funds: ctx.funds.total,
      hifzRate: ctx.hifz.records30d,
      attendanceRate: ctx.attendance.rate7d,
    },
  });
}
