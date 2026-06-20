"use client";
// PageBuilderDialog — create/edit a website page with section builder
import * as React from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/store/app-store";
import {
  type PageSection, type SectionType, type PageMeta,
  SECTION_META, SECTION_ORDER, newSection, parseSections,
} from "./page-section-types";
import { PageSectionEditor } from "./page-section-editor";
import { PagePreview } from "./page-preview";

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

export function PageBuilderDialog({
  open, onOpenChange, initial, onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: PageMeta | null;
  onSaved: () => void;
}) {
  const { t } = useApp();
  const [title, setTitle] = React.useState("");
  const [slug, setSlug] = React.useState("");
  const [slugTouched, setSlugTouched] = React.useState(false);
  const [sections, setSections] = React.useState<PageSection[]>([]);
  const [isPublished, setIsPublished] = React.useState(false);
  const [isHomepage, setIsHomepage] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Reset state when dialog opens (or initial changes)
  React.useEffect(() => {
    if (!open) return;
    setTitle(initial?.title || "");
    setSlug(initial?.slug || "");
    setSlugTouched(!!initial?.slug);
    setSections(initial?.sections ? [...initial.sections] : []);
    setIsPublished(initial?.isPublished ?? false);
    setIsHomepage(initial?.isHomepage ?? false);
  }, [open, initial]);

  // Auto-generate slug from title unless user manually edited slug
  React.useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  const addSection = (type: SectionType) => {
    setSections((arr) => [...arr, newSection(type)]);
  };
  const updateSection = (i: number, s: PageSection) => {
    setSections((arr) => { const a = [...arr]; a[i] = s; return a; });
  };
  const removeSection = (i: number) => {
    setSections((arr) => { const a = [...arr]; a.splice(i, 1); return a; });
  };
  const moveUp = (i: number) => {
    if (i === 0) return;
    setSections((arr) => {
      const a = [...arr];
      [a[i - 1], a[i]] = [a[i], a[i - 1]];
      return a;
    });
  };
  const moveDown = (i: number) => {
    setSections((arr) => {
      if (i >= arr.length - 1) return arr;
      const a = [...arr];
      [a[i + 1], a[i]] = [a[i], a[i + 1]];
      return a;
    });
  };

  const save = async () => {
    if (!title.trim()) {
      toast.error(t("website.pageTitle"));
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        slug: slug.trim() || slugify(title),
        sections,
        isPublished,
        isHomepage,
      };
      const url = initial?.id
        ? `/api/website/pages/${initial.id}`
        : "/api/website/pages";
      const method = initial?.id ? "PUT" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Save failed");
      toast.success(t("website.pageSaved"));
      onSaved();
      onOpenChange(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-hidden p-0">
        <DialogHeader className="border-b px-5 py-3">
          <DialogTitle className="flex items-center gap-2 text-base">
            {initial ? t("website.editPage") : t("website.createPage")}
            {isHomepage && <Badge className="bg-amber-100 text-amber-700">{t("website.homepageBadge")}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 overflow-y-auto p-5 md:grid-cols-2" style={{ maxHeight: "calc(92vh - 130px)" }}>
          {/* Editor column */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">{t("website.pageTitle")} *</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder={t("website.pageTitle")} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">{t("website.pageSlug")}</Label>
              <Input value={slug} onChange={(e) => { setSlug(e.target.value); setSlugTouched(true); }}
                placeholder="/about" />
              <p className="text-xs text-muted-foreground">{t("website.slugHint")}</p>
            </div>

            <div className="flex items-center gap-4 rounded-md border p-2">
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={isPublished} onCheckedChange={setIsPublished} />
                {t("website.publish")}
              </label>
              <label className="flex items-center gap-2 text-xs">
                <Switch checked={isHomepage} onCheckedChange={setIsHomepage} />
                {t("website.homepage")}
              </label>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {SECTION_ORDER.map((st) => {
                const Icon = SECTION_META[st].icon;
                return (
                  <Button key={st} size="sm" variant="outline"
                    className="h-7 gap-1 text-xs"
                    onClick={() => addSection(st)}>
                    <Icon className="size-3" />
                    {t(SECTION_META[st].i18nKey)}
                  </Button>
                );
              })}
            </div>

            <div className="space-y-2">
              {sections.length === 0 && (
                <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                  {t("website.addSection")}
                </div>
              )}
              {sections.map((s, i) => (
                <PageSectionEditor key={s.id} section={s} index={i} total={sections.length}
                  onChange={(ns) => updateSection(i, ns)}
                  onRemove={() => removeSection(i)}
                  onMoveUp={() => moveUp(i)}
                  onMoveDown={() => moveDown(i)}
                />
              ))}
            </div>
          </div>

          {/* Preview column */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <Plus className="size-3" /> {t("website.preview")}
            </div>
            <PagePreview sections={sections} />
          </div>
        </div>

        <DialogFooter className="border-t bg-slate-50/50 px-5 py-3 dark:bg-slate-900/30">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("common.cancel")}
          </Button>
          <Button onClick={save} disabled={saving}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            {t("website.savePage")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helper exported for the parent tab to parse stored sections
export function toPageMeta(row: {
  id: string; title: string; slug: string;
  sections: string; isPublished: boolean; isHomepage: boolean;
}): PageMeta {
  return {
    id: row.id, title: row.title, slug: row.slug,
    sections: parseSections(row.sections),
    isPublished: row.isPublished, isHomepage: row.isHomepage,
  };
}
