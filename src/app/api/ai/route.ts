// AI Assistant — context-aware chat using z-ai-web-dev-sdk.
// Server-side only. Returns reply + a small context snapshot for UI display.
import { NextRequest } from "next/server";
import { getSession } from "@/lib/session";
import { ok, fail, unauthorized } from "@/lib/api";
import { gatherAiContext, type AiContext } from "@/lib/ai-context";
import ZAI from "z-ai-web-dev-sdk";

// Detect language from the user's message; default Bengali.
function detectLang(msg: string): "bn" | "en" | "ar" {
  if (/[\u0980-\u09FF]/.test(msg)) return "bn"; // Bengali
  if (/[\u0600-\u06FF]/.test(msg)) return "ar"; // Arabic
  return "bn";
}

const LANG_NAME: Record<string, string> = { bn: "Bengali", en: "English", ar: "Arabic" };

function buildSystemPrompt(ctx: AiContext, lang: "bn" | "en" | "ar"): string {
  const ctxJson = JSON.stringify(ctx, null, 2);
  return `You are "Mufakkir" (مفكر — "The Thinker"), an AI assistant for a Madrasa Management ERP.

ROLE
- Help madrasa administrators understand their data, get insights, and receive actionable recommendations.
- Be helpful, concise, and Islamic-appropriate in tone. Begin your reply with a short Islamic greeting if it is the first message (e.g., "Assalamu Alaikum" / "আসসালামু আলাইকুম" / "السلام عليكم").
- Use plain text. Use line breaks for readability. Avoid markdown headings.

LANGUAGE
- Reply in ${LANG_NAME[lang]} (${lang}). If the user switches language, follow their language.
- Default to Bengali if the user's message language is unclear.

CONTEXT — REAL MADRASA DATA
You have access to the following live data snapshot for this madrasa (JSON):
${ctxJson}

GUIDANCE
- When asked about performance, trends, or recommendations, give SPECIFIC, actionable insights grounded in the data above. Quote real numbers and percentages.
- For Hifz-related questions, use proper terminology: Sabak (সবাক — new lesson), Sabaq Para (সবাক পারা — new portion), Dhor (ধর — revision). Reference quality ratings (1-5) and mistake counts.
- For finance questions, mention Shariah compliance where relevant: Lillah (للة — general charity), Waqf (وقف — endowment), Zakat (زكاة), Sadaqah (صدقة). For Zakat disbursement, mention Tamlik (تمليك — transfer of ownership to eligible recipient).
- For attendance, mention the 7-day rate.
- For fees, mention the 30-day collection vs pending.
- Keep answers under ~180 words unless the user asks for detail.
- If the question is unrelated to madrasa management, politely steer back to the madrasa context.
- Today's Hijri date is: ${ctx.hijriToday}. Mention it only if relevant.

Do not invent data not present in the context. If you don't know, say so honestly.`;
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return unauthorized();

  const body = (await req.json().catch(() => ({}))) as { message?: string; conversationId?: string };
  const message = (body.message || "").trim();
  if (!message) return fail("Message is required");
  if (message.length > 2000) return fail("Message too long (max 2000 chars)");

  const lang = detectLang(message);
  const ctx = await gatherAiContext(session, lang);
  const systemPrompt = buildSystemPrompt(ctx, lang);

  let reply: string;
  try {
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      thinking: { type: "disabled" },
    });
    reply = response?.choices?.[0]?.message?.content?.trim() || "";
    if (!reply) {
      return fail("AI returned an empty response. Please try again.", 502);
    }
  } catch (e) {
    console.error("[ai/chat] LLM error:", e);
    return fail("AI service is temporarily unavailable. Please try again.", 502);
  }

  return ok({
    reply,
    context: {
      students: ctx.students.total,
      teachers: ctx.teachers.total,
      classes: ctx.classes,
      funds: ctx.funds.total,
      fundsByType: ctx.funds.byType,
      hifzRate: ctx.hifz.records30d,
      hifzAvgQuality: ctx.hifz.avgQuality,
      attendanceRate: ctx.attendance.rate7d,
      feesCollected30d: ctx.fees.collected30d,
      feesPending: ctx.fees.pending,
      hijriToday: ctx.hijriToday,
      zakatEligibleStudents: ctx.students.zakatEligible,
    },
  });
}
