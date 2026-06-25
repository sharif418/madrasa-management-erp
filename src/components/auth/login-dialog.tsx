// Login dialog — phone + password authentication
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
import { Moon, Loader2, LogIn, UserCircle } from "lucide-react";
import { toast } from "sonner";

export function LoginDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { t, setUser } = useApp();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      setPhone("");
      setPassword("");
    }
  }, [open]);

  const submit = async () => {
    if (!phone || !password) {
      toast.error("Please enter phone and password");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "Login failed");
        return;
      }
      setUser(json.data.user, json.data.tenant.name);
      onOpenChange(false);
      router.push("/dashboard");
      toast.success(`Assalamu Alaikum, ${json.data.user.name}!`);
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const useDemo = async () => {
    setLoading(true);
    try {
      // Seed demo data first (idempotent)
      await fetch("/api/seed", { method: "POST" });
      // Login with demo creds
      setPhone("01700000000");
      setPassword("demo123");
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: "01700000000", password: "demo123" }),
      });
      const json = await res.json();
      if (!json.ok) {
        toast.error(json.error || "Demo login failed");
        return;
      }
      setUser(json.data.user, json.data.tenant.name);
      onOpenChange(false);
      router.push("/dashboard");
      toast.success("Demo account loaded — explore freely!");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
            <Moon className="h-7 w-7" />
          </div>
          <DialogTitle className="text-center text-xl">{t("auth.login.title")}</DialogTitle>
          <DialogDescription className="text-center">{t("auth.login.subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="login-phone">{t("auth.login.phone")}</Label>
            <Input
              id="login-phone"
              type="tel"
              placeholder="01XXXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              dir="ltr"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="login-password">{t("auth.login.password")}</Label>
            <Input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
          </div>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            onClick={submit}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
            {t("auth.login.submit")}
          </Button>
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>
          <Button variant="outline" className="w-full" onClick={useDemo} disabled={loading}>
            <UserCircle className="h-4 w-4" />
            {t("auth.login.demo")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
