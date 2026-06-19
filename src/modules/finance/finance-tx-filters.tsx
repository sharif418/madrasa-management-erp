"use client";
// Transactions filter bar — fund/type/date-range filters + summary chips + Add button.
import { useApp } from "@/store/app-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import type { Fund, TxType } from "./finance-types";

type Props = {
  funds: Fund[];
  fundId: string;
  type: "all" | TxType;
  from: string;
  to: string;
  sums: { income: number; expense: number; transfer: number };
  onFundId: (v: string) => void;
  onType: (v: "all" | TxType) => void;
  onFrom: (v: string) => void;
  onTo: (v: string) => void;
  onAdd: () => void;
};

export function TransactionsFilterBar({
  funds,
  fundId,
  type,
  from,
  to,
  sums,
  onFundId,
  onType,
  onFrom,
  onTo,
  onAdd,
}: Props) {
  const { t, locale } = useApp();

  const cur = (n: number) =>
    new Intl.NumberFormat(
      locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-US",
      { maximumFractionDigits: 0 }
    ).format(n || 0);

  return (
    <div className="p-4">
      <div className="flex flex-col lg:flex-row gap-3 lg:items-end">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 flex-1">
          <FilterSelect
            label={t("finance.funds")}
            value={fundId}
            onValueChange={onFundId}
            options={[
              { value: "all", label: t("finance.allFunds") },
              ...funds.map((f) => ({ value: f.id, label: f.name })),
            ]}
          />
          <FilterSelect
            label={t("finance.type")}
            value={type}
            onValueChange={(v) => onType(v as "all" | TxType)}
            options={[
              { value: "all", label: t("finance.allTypes") },
              { value: "income", label: t("finance.income") },
              { value: "expense", label: t("finance.expense") },
              { value: "transfer", label: t("finance.transfer") },
            ]}
          />
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t("finance.from")}
            </label>
            <Input
              type="date"
              value={from}
              onChange={(e) => onFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              {t("finance.to")}
            </label>
            <Input
              type="date"
              value={to}
              onChange={(e) => onTo(e.target.value)}
              className="h-9"
            />
          </div>
        </div>
        <Button onClick={onAdd} className="shrink-0">
          <Plus className="h-4 w-4" />
          {t("finance.addTransaction")}
        </Button>
      </div>

      <div className="flex flex-wrap gap-2 mt-3">
        <Chip
          label={t("finance.income")}
          value={`৳${cur(sums.income)}`}
          tone="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800"
        />
        <Chip
          label={t("finance.expense")}
          value={`৳${cur(sums.expense)}`}
          tone="text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800"
        />
        <Chip
          label={t("finance.transfer")}
          value={`৳${cur(sums.transfer)}`}
          tone="text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
        />
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options,
}: {
  label: string;
  value: string;
  onValueChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs text-muted-foreground">{label}</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Chip({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${tone}`}
    >
      {label}
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}
