"use client";
// SettingsRolesTab — placeholder + live list of tenant roles from DB (card layout)
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  ShieldCheck, Lock, Plus, Crown, UserCog, GraduationCap, User,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/store/app-store";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

// Pick an icon + tint based on the role name
function roleVisual(name: string): { icon: LucideIcon; tint: string } {
  const n = name.toLowerCase();
  if (n.includes("admin") || n.includes("super")) {
    return { icon: Crown, tint: "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" };
  }
  if (n.includes("teach") || n.includes("ustad")) {
    return { icon: GraduationCap, tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300" };
  }
  if (n.includes("manage") || n.includes("staff")) {
    return { icon: UserCog, tint: "bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-300" };
  }
  if (n.includes("guard") || n.includes("parent")) {
    return { icon: User, tint: "bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300" };
  }
  return { icon: ShieldCheck, tint: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" };
}

// Mock permission badges (visual only — derived from name; the API doesn't expose real perms yet)
function rolePermissions(name: string): string[] {
  const n = name.toLowerCase();
  if (n.includes("admin") || n.includes("super")) {
    return ["all", "users", "billing"];
  }
  if (n.includes("teach") || n.includes("ustad")) {
    return ["hifz", "attendance", "students"];
  }
  if (n.includes("manage") || n.includes("staff")) {
    return ["finance", "students", "reports"];
  }
  if (n.includes("guard") || n.includes("parent")) {
    return ["view_only"];
  }
  return ["view"];
}

export function SettingsRolesTab() {
  const { t, dir } = useApp();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [createOpen, setCreateOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/settings/roles", { cache: "no-store" });
        if (!r.ok) {
          if (alive) setRoles([]);
          return;
        }
        const j = await r.json();
        if (alive && j?.ok) setRoles(j.data.items as Role[]);
      } catch {
        if (alive) setRoles([]);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="space-y-4" dir={dir()}>
      <Card className="border-dashed bg-muted/30">
        <CardContent className="flex items-center gap-3 p-5">
          <div className="flex size-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
            <Lock className="size-5" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{t("settings.roles")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.rolesPlaceholder")}</p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
          >
            <Plus className="size-4" />
            {t("settings.createRole")}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4 text-emerald-600" />
            {t("settings.roles")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28" />)}
            </div>
          ) : roles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("settings.noRoles")}</p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {roles.map((r) => {
                const { icon: RoleIcon, tint } = roleVisual(r.name);
                const perms = rolePermissions(r.name);
                return (
                  <div
                    key={r.id}
                    className="group relative overflow-hidden rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${tint}`}>
                        <RoleIcon className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate text-sm font-semibold">{r.name}</h4>
                          {r.isSystem && (
                            <Badge variant="secondary" className="shrink-0 gap-1 bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              <Lock className="size-2.5" />
                              {t("settings.systemRole")}
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                          {r.description ?? t("settings.roleDesc")}
                        </p>
                      </div>
                    </div>
                    {/* Permission badges */}
                    <div className="mt-3 flex flex-wrap items-center gap-1 border-t pt-2.5">
                      <span className="me-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                        {t("settings.permissions")}
                      </span>
                      {perms.map((p) => (
                        <span
                          key={p}
                          className="inline-flex items-center rounded-full border bg-muted/50 px-2 py-0.5 text-[10px] font-medium text-muted-foreground"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Role — coming soon dialog */}
      <AlertDialog open={createOpen} onOpenChange={setCreateOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Plus className="size-4 text-emerald-600" />
              {t("settings.createRole")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.comingSoonDesc")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.close")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setCreateOpen(false)}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700"
            >
              {t("settings.comingSoon")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
