"use client";
// Export cards — 4 export buttons + a fee receipt lookup card.
// Each export card offers CSV + Excel downloads from GET /api/export/*?format=.
import * as React from "react";
import { toast } from "sonner";
import {
  Users, GraduationCap, Banknote, BookMarked,
  Download, Loader2, ReceiptText, FileSpreadsheet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useApp } from "@/store/app-store";
import { cn } from "@/lib/utils";

type ExportCardProps = {
  title: string;
  hint: string;
  icon: React.ReactNode;
  endpoint: string;          // e.g. "/api/export/students"
  baseFilename: string;      // e.g. "students" — extension added by format
  accent: string;            // Tailwind gradient e.g. "from-emerald-500 to-teal-600"
};

function ExportCard({ title, hint, icon, endpoint, baseFilename, accent }: ExportCardProps) {
  const { t } = useApp();
  const [loading, setLoading] = React.useState<"csv" | "xlsx" | null>(null);

  const onExport = async (format: "csv" | "xlsx") => {
    setLoading(format);
    try {
      const url = `${endpoint}?format=${format}`;
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `HTTP ${res.status}`);
      }
      const blob = await res.blob();
      const urlObj = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = urlObj;
      a.download = `${baseFilename}.${format === "csv" ? "csv" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(urlObj);
      toast.success(t("importExport.exported"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <Card className="group overflow-hidden border-0 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <CardHeader className="gap-2">
        <div className={cn("grid size-10 place-items-center rounded-xl bg-gradient-to-br text-white shadow-md", accent)}>
          {icon}
        </div>
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription className="text-xs">{hint}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          onClick={() => onExport("csv")}
          disabled={loading !== null}
          variant="outline"
          className="w-full gap-2"
        >
          {loading === "csv" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
          {t("export.csv")}
        </Button>
        <Button
          onClick={() => onExport("xlsx")}
          disabled={loading !== null}
          variant="outline"
          className="w-full gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:text-emerald-800 dark:border-emerald-900/60 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
        >
          {loading === "xlsx" ? <Loader2 className="size-4 animate-spin" /> : <FileSpreadsheet className="size-4" />}
          {t("export.excel")}
        </Button>
      </CardContent>
    </Card>
  );
}

export function ExportCards() {
  const { t } = useApp();
  const cards: ExportCardProps[] = [
    {
      title: t("importExport.exportStudents"),
      hint: t("importExport.exportHint"),
      icon: <Users className="size-5" />,
      endpoint: "/api/export/students",
      baseFilename: "students",
      accent: "from-emerald-500 to-teal-600",
    },
    {
      title: t("importExport.exportTeachers"),
      hint: t("importExport.exportHint"),
      icon: <GraduationCap className="size-5" />,
      endpoint: "/api/export/teachers",
      baseFilename: "teachers",
      accent: "from-teal-500 to-cyan-600",
    },
    {
      title: t("importExport.exportTransactions"),
      hint: t("importExport.exportHint"),
      icon: <Banknote className="size-5" />,
      endpoint: "/api/export/transactions",
      baseFilename: "transactions",
      accent: "from-amber-500 to-orange-600",
    },
    {
      title: t("importExport.exportHifz"),
      hint: t("importExport.exportHint"),
      icon: <BookMarked className="size-5" />,
      endpoint: "/api/export/hifz",
      baseFilename: "hifz-records",
      accent: "from-violet-500 to-purple-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <ExportCard key={c.endpoint} {...c} />
        ))}
      </div>
      <FeeReceiptCard />
    </div>
  );
}

function FeeReceiptCard() {
  const { t } = useApp();
  const [collectionId, setCollectionId] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  const onDownload = async () => {
    const id = collectionId.trim();
    if (!id) {
      toast.error(t("importExport.enterCollectionId"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/export/fee-receipt-pdf/${encodeURIComponent(id)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || t("importExport.receiptError"));
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      toast.success(t("importExport.receiptReady"));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("importExport.receiptError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="overflow-hidden border-0 shadow-sm">
      <CardHeader className="gap-2 border-b bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/40 dark:to-slate-900/10">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-md">
            <ReceiptText className="size-5" />
          </div>
          <div>
            <CardTitle className="text-base">{t("importExport.feeReceipt")}</CardTitle>
            <CardDescription className="text-xs">{t("importExport.receiptReady")}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={collectionId}
            onChange={(e) => setCollectionId(e.target.value)}
            placeholder={t("importExport.enterCollectionId")}
            dir="ltr"
            className="font-mono text-sm"
            onKeyDown={(e) => { if (e.key === "Enter") onDownload(); }}
          />
          <Button
            onClick={onDownload}
            disabled={loading}
            className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md hover:from-emerald-700 hover:to-teal-700"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {loading ? t("importExport.exporting") : t("importExport.downloadReceipt")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
