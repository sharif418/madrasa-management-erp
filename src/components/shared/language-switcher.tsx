// Language switcher dropdown — used in landing page header & app shell
"use client";
import { useApp } from "@/store/app-store";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/translations";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale } = useApp();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size={compact ? "icon" : "sm"} className="gap-2">
          <Globe className="h-4 w-4" />
          {!compact && (
            <span className="text-sm font-medium">
              {localeFlags[locale]} {localeNames[locale]}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {locales.map((l: Locale) => (
          <DropdownMenuItem
            key={l}
            onClick={() => setLocale(l)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span className="text-base">{localeFlags[l]}</span>
              <span>{localeNames[l]}</span>
            </span>
            {l === locale && <Check className="h-4 w-4 text-emerald-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
