// WebsiteSettingsTab — edit tenant contact info + about text + publish announcements
"use client";
import { useState } from "react";
import { Save, Send, Megaphone, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import type { WebsiteData, WebsiteTenant } from "./website-view";

type Props = {
  data: WebsiteData;
  aboutText: string;
  onAboutTextChange: (s: string) => void;
  onSaved: (tenant: WebsiteTenant) => void;
  onNoticePublished: () => void;
};

export function WebsiteSettingsTab({
  data, aboutText, onAboutTextChange, onSaved, onNoticePublished,
}: Props) {
  const { t } = useApp();
  const { tenant } = data;

  const [logoUrl, setLogoUrl] = useState(tenant.logoUrl || "");
  const [phone, setPhone] = useState(tenant.phone || "");
  const [email, setEmail] = useState(tenant.email || "");
  const [address, setAddress] = useState(tenant.address || "");
  const [saving, setSaving] = useState(false);

  // Announcement form
  const [anTitle, setAnTitle] = useState("");
  const [anContent, setAnContent] = useState("");
  const [anType, setAnType] = useState("general");
  const [publishing, setPublishing] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ logoUrl, phone, email, address }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      if (j.data?.tenant) onSaved(j.data.tenant);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const publishAnnouncement = async () => {
    if (!anTitle.trim() || !anContent.trim()) {
      toast.error(t("common.required"));
      return;
    }
    setPublishing(true);
    try {
      const r = await fetch("/api/website", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          announcement: { title: anTitle, content: anContent, type: anType },
        }),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) throw new Error(j?.error || "Failed");
      setAnTitle("");
      setAnContent("");
      setAnType("general");
      onNoticePublished();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Contact info card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
              <Building2 className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">{t("settings.tenant")}</CardTitle>
              <CardDescription>{t("website.subtitle")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="logo-url">{t("website.logoUrl")}</Label>
            <Input
              id="logo-url"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">{t("settings.phone")}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+880..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="email">{t("settings.email")}</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@..."
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">{t("settings.address")}</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              placeholder="..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="about">{t("website.aboutText")}</Label>
            <Textarea
              id="about"
              value={aboutText}
              onChange={(e) => onAboutTextChange(e.target.value)}
              rows={4}
              placeholder={t("website.aboutDesc")}
            />
            <p className="text-xs text-muted-foreground">{t("website.aboutDesc")}</p>
          </div>
          <Button
            onClick={save}
            disabled={saving}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
          >
            <Save className="me-2 size-4" />
            {saving ? t("common.loading") : t("website.save")}
          </Button>
        </CardContent>
      </Card>

      {/* Announcement card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md">
              <Megaphone className="size-4" />
            </div>
            <div>
              <CardTitle className="text-base">{t("website.announcementTitle")}</CardTitle>
              <CardDescription>{t("website.announcementHint")}</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="an-title">{t("website.announcementLabel")}</Label>
            <Input
              id="an-title"
              value={anTitle}
              onChange={(e) => setAnTitle(e.target.value)}
              placeholder="..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="an-content">{t("website.announcementContent")}</Label>
            <Textarea
              id="an-content"
              value={anContent}
              onChange={(e) => setAnContent(e.target.value)}
              rows={4}
              placeholder="..."
            />
          </div>
          <div className="space-y-1.5">
            <Label>{t("website.announcementType")}</Label>
            <Select value={anType} onValueChange={setAnType}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="exam">Exam</SelectItem>
                <SelectItem value="event">Event</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            onClick={publishAnnouncement}
            disabled={publishing}
            variant="outline"
            className="w-full border-amber-500/50 text-amber-700 hover:bg-amber-50 dark:text-amber-300 dark:hover:bg-amber-950/30"
          >
            <Send className="me-2 size-4" />
            {publishing ? t("common.loading") : t("website.publishAnnouncement")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
