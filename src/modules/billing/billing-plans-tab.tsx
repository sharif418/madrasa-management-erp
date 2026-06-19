// Billing Plans Tab — 4 plan cards + payment dialog flow
"use client";
import { useState } from "react";
import { Check, Crown, Sparkles, Star } from "lucide-react";
import { useApp } from "@/store/app-store";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { BillingData, Plan } from "./types";
import { PLAN_PRICES, PLAN_RANK } from "./types";
import { PaymentDialog, type PaymentMethod } from "./payment-dialog";

type Props = {
  data: BillingData;
  onUpgraded: () => void; // trigger reload
};

type PlanMeta = {
  key: Plan;
  gradient: string;
  popular?: boolean;
  features: string[]; // i18n keys
};

const PLAN_META: PlanMeta[] = [
  {
    key: "trial",
    gradient: "from-slate-500 to-slate-700",
    features: ["billing.features.trial1", "billing.featureModules", "billing.featureSupport"],
  },
  {
    key: "basic",
    gradient: "from-sky-500 to-cyan-600",
    features: ["billing.features.basic1", "billing.featureModules", "billing.featureStorage", "billing.featureSupport"],
  },
  {
    key: "pro",
    gradient: "from-emerald-500 to-teal-600",
    popular: true,
    features: [
      "billing.features.pro1", "billing.featureModules", "billing.featureStorage",
      "billing.featurePriority", "billing.featureCustom",
    ],
  },
  {
    key: "enterprise",
    gradient: "from-amber-500 to-orange-600",
    features: [
      "billing.features.enterprise1", "billing.featureModules", "billing.featureStorage",
      "billing.featurePriority", "billing.featureDedicated", "billing.featureCustom",
    ],
  },
];

export function BillingPlansTab({ data, onUpgraded }: Props) {
  const { t, dir } = useApp();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [targetPlan, setTargetPlan] = useState<Plan | null>(null);
  const currencySymbol = data.currency === "BDT" ? "৳" : data.currency === "SAR" ? "﷼" : "$";

  function openDialog(p: Plan) {
    setTargetPlan(p);
    setDialogOpen(true);
  }

  async function handleConfirm(method: PaymentMethod, reference: string) {
    if (!targetPlan) return;
    try {
      const r = await fetch("/api/billing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: targetPlan, paymentMethod: method, reference }),
      });
      const j = await r.json();
      if (!j?.ok) throw new Error(j?.error || "Failed");
      toast.success(t("billing.upgradeSuccess"));
      onUpgraded();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    }
  }

  return (
    <div className="space-y-6" dir={dir()}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_META.map((p) => {
          const isCurrent = data.plan === p.key;
          const isDowngrade = PLAN_RANK[p.key] < PLAN_RANK[data.plan];
          const price = PLAN_PRICES[p.key];
          const priceLabel = price === 0 ? t("billing.free") : `${currencySymbol}${price.toLocaleString()}`;

          return (
            <Card
              key={p.key}
              className={`relative flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 ${
                isCurrent ? "border-2 border-emerald-500 shadow-md" : "border-border"
              }`}
            >
              {p.popular && !isCurrent && (
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <Badge className="rounded-none bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                    <Star className="mr-1 size-3" /> Popular
                  </Badge>
                </div>
              )}
              {isCurrent && (
                <div className="absolute inset-x-0 top-0 flex justify-center">
                  <Badge className="rounded-none bg-emerald-600 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
                    <Check className="mr-1 size-3" /> {t("billing.currentPlanBadge")}
                  </Badge>
                </div>
              )}

              {/* Gradient header */}
              <div className={`relative bg-gradient-to-br ${p.gradient} p-5 pt-7 text-white`}>
                <div
                  className="pointer-events-none absolute inset-0 opacity-[0.12]"
                  aria-hidden="true"
                  style={{
                    backgroundImage:
                      "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
                    backgroundSize: "40px 40px",
                    backgroundRepeat: "repeat",
                  }}
                />
                <div className="relative">
                  <div className="mb-2 flex items-center gap-2">
                    {p.key === "enterprise" ? (
                      <Crown className="size-5" />
                    ) : p.popular ? (
                      <Sparkles className="size-5" />
                    ) : null}
                    <h3 className="text-lg font-bold tracking-tight">{t(`billing.${p.key}`)}</h3>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold">{priceLabel}</span>
                    {price > 0 && (
                      <span className="text-sm opacity-80">{t("billing.perMonth")}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Features */}
              <CardContent className="flex-1 p-5">
                <ul className="space-y-2.5 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 size-4 flex-shrink-0 text-emerald-600" />
                      <span className="text-muted-foreground">{t(f)}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* Footer */}
              <CardFooter className="p-5 pt-0">
                {isCurrent ? (
                  <Button variant="outline" disabled className="w-full">
                    <Check className="size-4" /> {t("billing.currentPlanBadge")}
                  </Button>
                ) : (
                  <Button
                    onClick={() => openDialog(p.key)}
                    className={`w-full ${
                      isDowngrade
                        ? "bg-gradient-to-r from-slate-500 to-slate-700 text-white hover:from-slate-600 hover:to-slate-800"
                        : "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                    }`}
                  >
                    {isDowngrade ? t("billing.changePlan") : t("billing.upgrade")}
                  </Button>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {targetPlan && targetPlan !== "trial" && (
        <PaymentDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          targetPlan={targetPlan as "basic" | "pro" | "enterprise"}
          price={PLAN_PRICES[targetPlan]}
          currency={data.currency}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  );
}
