"use client";
// SettingsAppearanceTab — wraps ThemeCustomizer + Session Language card
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Languages } from "lucide-react";
import { useApp } from "@/store/app-store";
import { ThemeCustomizer } from "./theme-customizer";
import type { TenantInfo } from "./settings-info";

export function SettingsAppearanceTab({
  info,
  onSaved,
}: {
  info: TenantInfo | null;
  onSaved: (t: TenantInfo) => void;
}) {
  const { t, locale, setLocale } = useApp();

  return (
    <div className="space-y-4">
      <ThemeCustomizer info={info} onSaved={onSaved} />

      {/* Session language */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Languages className="size-4 text-emerald-600" />
            {t("settings.sessionLang")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {t("settings.sessionLang")} — {t("settings.language")}
          </p>
          <div className="max-w-xs">
            <Label className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t("settings.sessionLang")}
            </Label>
            <Select
              value={locale}
              onValueChange={(v) => setLocale(v as "bn" | "en" | "ar")}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">বাংলা</SelectItem>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="ar">العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
