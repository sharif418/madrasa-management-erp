"use client";
// ProfileDocumentsTab — 6th tab of Student Profile: upload/list/view/delete documents
import * as React from "react";
import {
  FileText, Upload, Trash2, Eye, Download, FileImage, FileCheck,
  Loader2, FolderOpen, Filter,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

type DocType = "birth_certificate" | "transfer_certificate" | "medical" | "photo" | "other";

type DocItem = {
  id: string;
  title: string;
  type: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
};

const TYPE_META: Record<DocType, { icon: typeof FileText; tkey: string; tint: string }> = {
  birth_certificate: { icon: FileCheck, tkey: "student.birthCertificate", tint: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" },
  transfer_certificate: { icon: FileText, tkey: "student.transferCertificate", tint: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" },
  medical: { icon: FileCheck, tkey: "student.medicalRecord", tint: "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300" },
  photo: { icon: FileImage, tkey: "student.photo", tint: "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300" },
  other: { icon: FileText, tkey: "student.otherDocument", tint: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300" },
};

export function ProfileDocumentsTab({ studentId }: { studentId: string }) {
  const { t, locale } = useApp();
  const { toast } = useToast();
  const [items, setItems] = React.useState<DocItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<string>("all");
  const [uploadOpen, setUploadOpen] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/documents`, { cache: "no-store" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      setItems(json.data.items as DocItem[]);
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [studentId, toast]);

  React.useEffect(() => { void load(); }, [load]);

  function viewDoc(doc: DocItem) {
    const url = `/api/students/${encodeURIComponent(studentId)}/documents/${encodeURIComponent(doc.id)}`;
    window.open(url, "_blank");
  }

  async function handleDelete() {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/documents/${encodeURIComponent(deleteId)}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast({ title: t("students.deleteSuccess") });
      setItems((p) => p.filter((d) => d.id !== deleteId));
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setDeleteId(null);
    }
  }

  const filtered = filter === "all" ? items : items.filter((d) => d.type === filter);

  return (
    <div className="space-y-4">
      {/* Header row: filter + upload */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="size-3.5" /> {t("student.documentType")}
          </Label>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[220px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.all")}</SelectItem>
              {(Object.keys(TYPE_META) as DocType[]).map((k) => (
                <SelectItem key={k} value={k}>{t(TYPE_META[k].tkey)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setUploadOpen(true)} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
          <Upload className="size-4" /> {t("student.uploadDocument")}
        </Button>
      </div>

      {/* List */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : filtered.length === 0 ? (
        <EmptyState title={t("student.noDocuments")} />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((doc) => {
            const meta = TYPE_META[doc.type as DocType] ?? TYPE_META.other;
            const Icon = meta.icon;
            return (
              <Card key={doc.id} className="group transition-shadow hover:shadow-md">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className={cn("inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg", meta.tint)}>
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-semibold" title={doc.title}>{doc.title}</p>
                      <Badge variant="outline" className={cn("shrink-0", meta.tint)}>{t(meta.tkey)}</Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground" title={doc.fileName}>{doc.fileName}</p>
                    <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>{fmtSize(doc.fileSize)}</span>
                      <span>·</span>
                      <span>{fmtDate(doc.uploadedAt, locale)}</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => viewDoc(doc)}>
                        <Eye className="size-3.5" /> {t("students.view")}
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 gap-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => setDeleteId(doc.id)}>
                        <Trash2 className="size-3.5" /> {t("common.delete")}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {uploadOpen && (
        <UploadDialog
          studentId={studentId}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { setUploadOpen(false); void load(); }}
        />
      )}

      <AlertDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("common.confirm")}</AlertDialogTitle>
            <AlertDialogDescription>{t("common.delete")}? — {t("students.delete")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-rose-600 hover:bg-rose-700">{t("common.delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function UploadDialog({ studentId, onClose, onUploaded }: {
  studentId: string; onClose: () => void; onUploaded: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<DocType>("other");
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  async function submit() {
    if (!title.trim()) { toast({ title: t("student.documentTitle"), description: "required", variant: "destructive" }); return; }
    if (!file) { toast({ title: t("student.uploadDocument"), description: "file required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("title", title.trim());
      fd.append("type", type);
      fd.append("file", file);
      const res = await fetch(`/api/students/${encodeURIComponent(studentId)}/documents`, { method: "POST", body: fd });
      const json = await res.json();
      if (!json.ok) throw new Error(json.error);
      toast({ title: t("student.documentUploaded") });
      onUploaded();
    } catch (e) {
      toast({ title: e instanceof Error ? e.message : "Error", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
              <Upload className="size-4" />
            </div>
            {t("student.uploadDocument")}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="doc-title">{t("student.documentTitle")}</Label>
            <Input id="doc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Birth Certificate 2024" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("student.documentType")}</Label>
            <Select value={type} onValueChange={(v) => setType(v as DocType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(TYPE_META) as DocType[]).map((k) => (
                  <SelectItem key={k} value={k}>{t(TYPE_META[k].tkey)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="doc-file">File (max 5 MB)</Label>
            <Input id="doc-file" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground">{file.name} · {fmtSize(file.size)}</p>}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={busy}>{t("common.cancel")}</Button></DialogClose>
          <Button onClick={submit} disabled={busy} className="gap-1.5 bg-emerald-600 hover:bg-emerald-700">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
            {t("student.uploadDocument")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed py-14 text-center">
      <div className="mx-auto mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700 dark:text-emerald-400">
        <FolderOpen className="size-5" />
      </div>
      <p className="text-sm font-medium">{title}</p>
    </div>
  );
}

function fmtSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function fmtDate(iso: string, locale: string): string {
  try {
    return new Intl.DateTimeFormat(locale === "ar" ? "ar-EG" : locale === "bn" ? "bn-BD" : "en-GB",
      { year: "numeric", month: "short", day: "numeric" }).format(new Date(iso));
  } catch { return iso; }
}
