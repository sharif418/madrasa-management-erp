// Compose tab — message composer with channel/audience selectors + reach preview
"use client";
import { useState } from "react";
import {
  MessageSquare, Smartphone, MessageCircle, Mail, Send, Users, UserCog,
  GraduationCap, Globe, Info, Loader2,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type Channel = "app" | "sms" | "whatsapp" | "email";
type Audience = "all" | "parents" | "staff" | "students";

const CHANNEL_OPTS: { value: Channel; iconKey: string }[] = [
  { value: "app", iconKey: "inApp" },
  { value: "sms", iconKey: "sms" },
  { value: "whatsapp", iconKey: "whatsapp" },
  { value: "email", iconKey: "email" },
];

const AUDIENCE_OPTS: { value: Audience; iconKey: string }[] = [
  { value: "all", iconKey: "all" },
  { value: "parents", iconKey: "parents" },
  { value: "staff", iconKey: "staff" },
  { value: "students", iconKey: "students" },
];

const CHANNEL_ICONS: Record<Channel, typeof MessageSquare> = {
  app: MessageSquare,
  sms: Smartphone,
  whatsapp: MessageCircle,
  email: Mail,
};

const AUDIENCE_ICONS: Record<Audience, typeof Users> = {
  all: Globe,
  parents: Users,
  staff: UserCog,
  students: GraduationCap,
};

export type ComposeTabProps = {
  reach: { all: number; parents: number; staff: number; students: number };
  onSent: (count: number) => void;
};

export function ComposeTab({ reach, onSent }: ComposeTabProps) {
  const { t, dir } = useApp();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState<Channel>("app");
  const [audience, setAudience] = useState<Audience>("all");
  const [sending, setSending] = useState(false);

  const recipientCount = reach[audience];
  const valid = title.trim().length > 0 && body.trim().length > 0 && !sending;

  async function send() {
    if (!valid) return;
    setSending(true);
    try {
      const r = await fetch("/api/communications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, channel, audience }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Failed to send");
      onSent(j.data.sent);
      setTitle("");
      setBody("");
    } catch (e) {
      // Bubble to parent view via callback? For now, local toast fallback handled in parent.
      onSent(-1);
      void e;
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3" dir={dir()}>
      {/* Composer */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="size-4 text-cyan-600" />
            {t("communications.compose")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cm-title">{t("communications.title_field")}</Label>
            <Input
              id="cm-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("communications.title_field")}
              maxLength={200}
              dir={dir()}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="cm-body">{t("communications.message")}</Label>
            <Textarea
              id="cm-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={t("communications.message")}
              rows={6}
              dir={dir()}
            />
          </div>

          <div className="space-y-1.5">
            <Label>{t("communications.channel")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CHANNEL_OPTS.map((opt) => {
                const Icon = CHANNEL_ICONS[opt.value];
                const active = channel === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setChannel(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                      active
                        ? "border-cyan-500 bg-cyan-50 text-cyan-700 shadow-sm dark:bg-cyan-950/30 dark:text-cyan-300"
                        : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium">{t(`communications.${opt.iconKey}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>{t("communications.audience")}</Label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {AUDIENCE_OPTS.map((opt) => {
                const Icon = AUDIENCE_ICONS[opt.value];
                const active = audience === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAudience(opt.value)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-xl border p-3 transition-all",
                      active
                        ? "border-teal-500 bg-teal-50 text-teal-700 shadow-sm dark:bg-teal-950/30 dark:text-teal-300"
                        : "border-border bg-background hover:bg-muted/50"
                    )}
                  >
                    <Icon className="size-5" />
                    <span className="text-xs font-medium">{t(`communications.${opt.iconKey}`)}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="rounded-lg bg-gradient-to-r from-cyan-50 to-teal-50 dark:from-cyan-950/30 dark:to-teal-950/30 px-3 py-2 text-sm font-medium text-cyan-700 dark:text-cyan-300">
              {t("communications.reach", { count: recipientCount })}
            </div>
            <Button
              onClick={send}
              disabled={!valid}
              className="bg-gradient-to-r from-cyan-600 to-teal-600 text-white hover:from-cyan-700 hover:to-teal-700"
            >
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              {t("communications.send")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Side: gateway note + audience reach cards */}
      <div className="space-y-4">
        <Card className="border-amber-200 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20">
          <CardContent className="flex gap-3 pt-4">
            <Info className="size-5 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="text-xs leading-relaxed text-amber-800 dark:text-amber-200">
              {t("communications.gatewayNote")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("communications.audience")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {AUDIENCE_OPTS.map((opt) => {
              const Icon = AUDIENCE_ICONS[opt.value];
              const count = reach[opt.value];
              return (
                <div
                  key={opt.value}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border px-3 py-2 transition-colors",
                    audience === opt.value
                      ? "border-teal-300 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30"
                      : "border-border"
                  )}
                >
                  <Icon className="size-4 text-teal-600 dark:text-teal-400" />
                  <span className="flex-1 text-sm font-medium">{t(`communications.${opt.iconKey}`)}</span>
                  <span className="text-sm tabular-nums font-semibold">{count}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
