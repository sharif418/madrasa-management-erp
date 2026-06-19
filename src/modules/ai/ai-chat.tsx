"use client";
// AiChat — chat interface: message list (user/AI bubbles), input box, suggested questions.
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Sparkles, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { AiSuggestions } from "./ai-suggestions";
import type { AiContextSnapshot } from "./ai-view";

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const uid = () => Math.random().toString(36).slice(2, 10);

export function AiChat({ onContextUpdate }: { onContextUpdate: (c: AiContextSnapshot) => void }) {
  const { t, dir } = useApp();
  const [messages, setMessages] = React.useState<ChatMsg[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new message
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: ChatMsg = { id: uid(), role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      const json = await res.json();
      if (!json?.ok) {
        throw new Error(json?.error || t("ai.error"));
      }
      const aiMsg: ChatMsg = { id: uid(), role: "assistant", content: json.data.reply };
      setMessages((prev) => [...prev, aiMsg]);
      if (json.data.context) onContextUpdate(json.data.context as AiContextSnapshot);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("ai.error"));
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  };

  return (
    <Card className="h-[calc(100vh-13rem)] min-h-[480px] flex flex-col overflow-hidden border-violet-200/60 dark:border-violet-900/40">
      {/* Header strip */}
      <div className="flex items-center justify-between gap-2 border-b border-violet-200/60 dark:border-violet-900/40 bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid size-7 place-items-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 text-white">
            <Sparkles className="size-3.5" />
          </div>
          <div className="leading-tight">
            <p className="text-xs font-semibold">Mufakkir</p>
            <p className="text-[10px] text-muted-foreground">مفكر · AI Assistant</p>
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:text-emerald-300">
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Online
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1" dir={dir()}>
        <div ref={scrollRef} className="px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-4 grid size-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-lg shadow-violet-500/20">
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
                <Sparkles className="relative size-7" />
              </div>
              <p className="text-sm font-medium">{t("ai.noMessages")}</p>
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">{t("ai.noMessagesDesc")}</p>
            </div>
          )}

          <AnimatePresence initial={false}>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={m.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <div className={`flex items-end gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
                  <div
                    className={`grid size-7 shrink-0 place-items-center rounded-full ${
                      m.role === "user"
                        ? "bg-emerald-500 text-white"
                        : "bg-gradient-to-br from-violet-500 to-purple-600 text-white"
                    }`}
                  >
                    {m.role === "user" ? <User className="size-3.5" /> : <Sparkles className="size-3.5" />}
                  </div>
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${
                      m.role === "user"
                        ? "bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-br-sm"
                        : "bg-violet-100 dark:bg-violet-950/40 text-foreground rounded-bl-sm"
                    }`}
                    dir="auto"
                  >
                    {m.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="flex items-end gap-2">
                <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Sparkles className="size-3.5" />
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-violet-100 dark:bg-violet-950/40 px-4 py-3">
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.3s]" />
                    <span className="size-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:-0.15s]" />
                    <span className="size-1.5 rounded-full bg-violet-500 animate-bounce" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Suggestions */}
      <AiSuggestions onPick={send} disabled={loading} />

      {/* Input */}
      <div className="border-t border-violet-200/60 dark:border-violet-900/40 p-3 bg-background">
        <div className="flex items-center gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={t("ai.placeholder")}
            disabled={loading}
            maxLength={2000}
            className="border-violet-200 focus-visible:ring-violet-500/40"
          />
          <Button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            size="icon"
            className="shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white"
            aria-label={t("ai.send")}
          >
            <Send className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
