"use client";
// PageSectionEditor — inline editor for a single page section
import * as React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  ChevronUp, ChevronDown, Trash2, Plus, GripVertical,
} from "lucide-react";
import { useApp } from "@/store/app-store";
import {
  type PageSection, type SectionItem, SECTION_META,
} from "./page-section-types";

export function PageSectionEditor({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: {
  section: PageSection;
  index: number;
  total: number;
  onChange: (s: PageSection) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}) {
  const { t } = useApp();
  const meta = SECTION_META[section.type];
  const Icon = meta.icon;

  const set = (patch: Partial<PageSection>) => onChange({ ...section, ...patch });

  const setItem = (i: number, patch: Partial<SectionItem>) => {
    const items = [...(section.items || [])];
    items[i] = { ...items[i], ...patch };
    set({ items });
  };
  const addItem = () => {
    const items = [...(section.items || []), {}];
    set({ items });
  };
  const removeItem = (i: number) => {
    const items = [...(section.items || [])];
    items.splice(i, 1);
    set({ items });
  };

  return (
    <div className="rounded-lg border border-emerald-100 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-card">
      <div className="flex items-center justify-between gap-2 border-b bg-emerald-50/60 px-3 py-2 dark:bg-emerald-950/20">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <GripVertical className="size-4 text-muted-foreground" />
          <Icon className="size-4 text-emerald-600" />
          <span>{t(meta.i18nKey)}</span>
          <span className="text-xs font-normal text-muted-foreground">#{index + 1}</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" className="size-7"
            disabled={index === 0} onClick={onMoveUp} title={t("website.moveUp")}>
            <ChevronUp className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7"
            disabled={index === total - 1} onClick={onMoveDown} title={t("website.moveDown")}>
            <ChevronDown className="size-4" />
          </Button>
          <Button size="icon" variant="ghost" className="size-7 text-rose-600"
            onClick={onRemove} title={t("website.removeSection")}>
            <Trash2 className="size-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-3">
        {/* Title — common to most sections */}
        {section.type !== "stats" && (
          <div className="space-y-1">
            <Label className="text-xs">{t("website.pageTitle")}</Label>
            <Input value={section.title || ""}
              onChange={(e) => set({ title: e.target.value })} />
          </div>
        )}

        {/* Subtitle — hero, cta */}
        {(section.type === "hero" || section.type === "cta") && (
          <div className="space-y-1">
            <Label className="text-xs">{t("website.subtitle2")}</Label>
            <Input value={section.subtitle || ""}
              onChange={(e) => set({ subtitle: e.target.value })} />
          </div>
        )}

        {/* Content — text only */}
        {section.type === "text" && (
          <div className="space-y-1">
            <Label className="text-xs">{t("website.content")}</Label>
            <Textarea rows={4} value={section.content || ""}
              onChange={(e) => set({ content: e.target.value })} />
          </div>
        )}

        {/* CTA text — hero, cta */}
        {(section.type === "hero" || section.type === "cta") && (
          <div className="space-y-1">
            <Label className="text-xs">{t("website.ctaText")}</Label>
            <Input value={section.ctaText || ""}
              onChange={(e) => set({ ctaText: e.target.value })} />
          </div>
        )}

        {/* Items — stats, features, gallery, contact */}
        {["stats", "features", "gallery", "contact"].includes(section.type) && (
          <div className="space-y-2">
            <Label className="text-xs">{t("website.items")}</Label>
            {(section.items || []).map((it, i) => (
              <ItemEditor key={i} type={section.type} item={it}
                onChange={(p) => setItem(i, p)} onRemove={() => removeItem(i)} />
            ))}
            <Button size="sm" variant="outline" onClick={addItem} className="w-full">
              <Plus className="size-3.5" /> {t("common.add")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function ItemEditor({
  type, item, onChange, onRemove,
}: {
  type: string;
  item: SectionItem;
  onChange: (p: Partial<SectionItem>) => void;
  onRemove: () => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 rounded-md border bg-slate-50/50 p-2 dark:bg-slate-900/30">
      {type === "stats" && (
        <>
          <Input placeholder="500" value={item.number || ""}
            onChange={(e) => onChange({ number: e.target.value })} />
          <Input placeholder="Students" value={item.label || ""}
            onChange={(e) => onChange({ label: e.target.value })} />
        </>
      )}
      {type === "features" && (
        <>
          <Input placeholder="Title" value={item.title || ""}
            onChange={(e) => onChange({ title: e.target.value })} />
          <Input placeholder="Description" value={item.description || ""}
            onChange={(e) => onChange({ description: e.target.value })} />
        </>
      )}
      {type === "gallery" && (
        <>
          <Input placeholder="Image URL" value={item.image || ""}
            onChange={(e) => onChange({ image: e.target.value })} />
          <Input placeholder="Caption" value={item.title || ""}
            onChange={(e) => onChange({ title: e.target.value })} />
        </>
      )}
      {type === "contact" && (
        <>
          <Input placeholder="Label" value={item.label || ""}
            onChange={(e) => onChange({ label: e.target.value })} />
          <Input placeholder="Value" value={item.description || ""}
            onChange={(e) => onChange({ description: e.target.value })} />
        </>
      )}
      <Button size="icon" variant="ghost" className="col-span-2 size-6 justify-self-end text-rose-600"
        onClick={onRemove}>
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}
