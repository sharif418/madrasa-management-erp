"use client";
// SettingsRolesTab — placeholder + live list of tenant roles from DB
import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck, Lock } from "lucide-react";
import { useApp } from "@/store/app-store";

type Role = {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
};

export function SettingsRolesTab() {
  const { t, dir } = useApp();
  const [roles, setRoles] = React.useState<Role[]>([]);
  const [loading, setLoading] = React.useState(true);

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
          <div>
            <p className="text-sm font-medium">{t("settings.roles")}</p>
            <p className="text-xs text-muted-foreground">{t("settings.rolesPlaceholder")}</p>
          </div>
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
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : roles.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">{t("settings.noRoles")}</p>
          ) : (
            <ul className="divide-y">
              {roles.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.name}</p>
                    {r.description && (
                      <p className="truncate text-xs text-muted-foreground">{r.description}</p>
                    )}
                  </div>
                  {r.isSystem && (
                    <Badge variant="secondary" className="shrink-0">System</Badge>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
