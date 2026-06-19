"use client";
// BookForm — Add/Edit dialog with title, Arabic title, author, category, ISBN,
// total copies, shelf location, and description.
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Library, Save } from "lucide-react";
import { useApp } from "@/store/app-store";
import { useToast } from "@/hooks/use-toast";
import { CATEGORY_LIST, type Book } from "./types";

export function BookForm({
  open, onOpenChange, editing, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  editing: Book | null;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const { toast } = useToast();
  const [title, setTitle] = React.useState("");
  const [titleArabic, setTitleArabic] = React.useState("");
  const [author, setAuthor] = React.useState("");
  const [category, setCategory] = React.useState<string>("other");
  const [isbn, setIsbn] = React.useState("");
  const [copies, setCopies] = React.useState("1");
  const [shelf, setShelf] = React.useState("");
  const [desc, setDesc] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!open) return;
    setTitle(editing?.title ?? "");
    setTitleArabic(editing?.titleArabic ?? "");
    setAuthor(editing?.author ?? "");
    setCategory(editing?.category ?? "other");
    setIsbn(editing?.isbn ?? "");
    setCopies(String(editing?.totalCopies ?? 1));
    setShelf(editing?.shelfLocation ?? "");
    setDesc(editing?.description ?? "");
  }, [open, editing]);

  const submit = async () => {
    if (!title.trim()) {
      toast({ title: t("library.failed"), description: t("common.required"), variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        titleArabic: titleArabic.trim(),
        author: author.trim(),
        category,
        isbn: isbn.trim(),
        totalCopies: Number(copies) || 1,
        shelfLocation: shelf.trim(),
        description: desc.trim(),
      };
      const r = editing
        ? await fetch(`/api/library/${editing.id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          })
        : await fetch("/api/library", {
            method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
          });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast({ title: t("library.saved") });
      onOpenChange(false);
      onSaved();
    } catch {
      toast({ title: t("library.failed"), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Library className="size-5 text-amber-600" />
            {editing ? t("common.edit") : t("library.addBook")}
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-title">{t("library.bookTitle")} *</Label>
              <Input id="bf-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-ta">{t("library.titleArabic")}</Label>
              <Input id="bf-ta" value={titleArabic} onChange={(e) => setTitleArabic(e.target.value)} dir="rtl" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="bf-author">{t("library.author")}</Label>
              <Input id="bf-author" value={author} onChange={(e) => setAuthor(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>{t("library.category")}</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORY_LIST.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-isbn">{t("library.isbn")}</Label>
              <Input id="bf-isbn" value={isbn} onChange={(e) => setIsbn(e.target.value)} dir="ltr" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="bf-copies">{t("library.copies")}</Label>
              <Input id="bf-copies" type="number" min={0} value={copies} onChange={(e) => setCopies(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="bf-shelf">{t("library.shelfLocation")}</Label>
              <Input id="bf-shelf" value={shelf} onChange={(e) => setShelf(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="bf-desc">{t("library.description")}</Label>
            <Textarea id="bf-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} maxLength={1000} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>{t("common.cancel")}</Button>
          <Button onClick={submit} disabled={saving} className="bg-amber-600 hover:bg-amber-700">
            <Save className="size-4" /> {saving ? t("common.loading") : t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
