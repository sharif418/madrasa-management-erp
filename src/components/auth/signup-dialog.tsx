// Signup dialog — register a new madrasa (tenant) with super admin
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Moon, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { Locale } from "@/i18n/translations";

export function SignupDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, setUser, locale } = useApp();
  const router = useRouter();
  const [madrasaName, setMadrasaName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [lang, setLang] = useState<Locale>(locale);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setMadrasaName("");
      setPhone("");
      setPassword("");
      setConfirm("");
    }
  }, [open]);

  const submit = async () => {
    if (!madrasaName || !phone || !password) {
      toast.error("Please fill all required fields");
      return;
    }
    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ madrasaName, phone, password, language: lang }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "Signup failed");
        return;
      }
      setUser(json.data.user, json.data.tenant.name);
      onOpenChange(false);
      router.push("/dashboard");
      toast.success(`Welcome! Your madrasa "${json.data.tenant.name}" is ready.`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Moon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl">{t("auth.signup.title")}</DialogTitle>
          <DialogDescription className="text-center">{t("auth.signup.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="su-name">{t("auth.signup.madrasaName")}</Label>
            <Input
              id="su-name"
              placeholder="Darul Uloom ..."
              value={madrasaName}
              onChange={(e) => setMadrasaName(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="su-phone">{t("auth.signup.phone")}</Label>
            <Input
              id="su-phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              dir="ltr"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="su-pass">{t("auth.signup.password")}</Label>
              <Input
                id="su-pass"
                type="password"
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="su-confirm">{t("auth.signup.confirm")}</Label>
              <Input
                id="su-confirm"
                type="password"
                placeholder="••••••"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="su-lang">{t("settings.language")}</Label>
            <Select value={lang} onValueChange={(v) => setLang(v as Locale)}>
              <SelectTrigger id="su-lang"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">🇧🇩 বাংলা</SelectItem>
                <SelectItem value="en">🇬🇧 English</SelectItem>
                <SelectItem value="ar">🇸🇦 العربية</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={submit}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            {t("auth.signup.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
