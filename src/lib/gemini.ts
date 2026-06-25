// Gemini AI client — wraps @google/generative-ai for the Mufakkir AI assistant.
// Replaces the previous z-ai-web-dev-sdk dependency with Google's official SDK.

import { GoogleGenerativeAI, type GenerationConfig } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY;

let _genAI: GoogleGenerativeAI | null = null;

function getClient(): GoogleGenerativeAI {
  if (!API_KEY) {
    throw new Error(
      "GEMINI_API_KEY environment variable is required for AI features. " +
        "Get one at https://aistudio.google.com/apikey"
    );
  }
  if (!_genAI) {
    _genAI = new GoogleGenerativeAI(API_KEY);
  }
  return _genAI;
}

// Default model — Gemini 2.0 Flash for fast, cost-effective responses
const DEFAULT_MODEL = "gemini-2.0-flash";

/**
 * Send a chat message with a system prompt and get a text response.
 * Used by the AI chat endpoint.
 */
export async function chatCompletion(opts: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
}): Promise<string> {
  const genAI = getClient();
  const model = genAI.getGenerativeModel({
    model: opts.model || DEFAULT_MODEL,
    systemInstruction: opts.systemPrompt,
  });

  const result = await model.generateContent(opts.userMessage);
  const response = result.response;
  const text = response.text();

  if (!text || text.trim().length === 0) {
    throw new Error("AI returned an empty response");
  }

  return text.trim();
}

/**
 * Generate structured JSON output from a prompt.
 * Used by the AI insights endpoint.
 */
export async function jsonCompletion<T>(opts: {
  systemPrompt: string;
  userMessage: string;
  model?: string;
}): Promise<string> {
  const genAI = getClient();

  const generationConfig: GenerationConfig = {
    responseMimeType: "application/json",
  };

  const model = genAI.getGenerativeModel({
    model: opts.model || DEFAULT_MODEL,
    systemInstruction: opts.systemPrompt,
    generationConfig,
  });

  const result = await model.generateContent(opts.userMessage);
  const response = result.response;
  return response.text().trim();
}
