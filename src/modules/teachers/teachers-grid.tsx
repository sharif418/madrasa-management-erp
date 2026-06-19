"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Pencil, Trash2, Phone, Mail, Loader2, Users, MapPin, CalendarDays,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useApp } from "@/store/app-store";

import { getInitials, getAvatarGradient, type TeacherDTO } from "./types";

type Props = {
  teachers: TeacherDTO[];
  currency: string;
  onEdit: (teacher: TeacherDTO) => void;
  onChanged: () => void;
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function TeachersGrid({ teachers, currency, onEdit, onChanged }: Props) {
  const { t } = useApp();
  const [deleteTarget, setDeleteTarget] = useState<TeacherDTO | null>(null);
  const [deleting, setDeleting] = useState(false);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/teachers/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      toast.success(t("teachers.deleteSuccess"));
      setDeleteTarget(null);
      onChanged();
    } catch (err) {
      toast.error(t("teachers.deleteFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {teachers.map((teacher, idx) => (
          <TeacherCard
            key={teacher.id}
            teacher={teacher}
            currency={currency}
            index={idx}
            onEdit={() => onEdit(teacher)}
            onDelete={() => setDeleteTarget(teacher)}
          />
        ))}
      </div>

      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("teachers.confirmDelete")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("teachers.confirmDeleteDesc", { name: deleteTarget?.name ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              {deleting ? t("teachers.deleting") : t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function TeacherCard({
  teacher, currency, index, onEdit, onDelete,
}: {
  teacher: TeacherDTO;
  currency: string;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { t } = useApp();
  const gradient = getAvatarGradient(teacher.name);
  const initials = getInitials(teacher.name);
  const spec = teacher.specialization || "general";
  const joinDate = teacher.joinDate
    ? new Date(teacher.joinDate).toLocaleDateString(undefined, {
        year: "numeric", month: "short", day: "numeric",
      })
    : "—";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: Math.min(index * 0.04, 0.3) }}
    >
      <Card className="group relative overflow-hidden py-0 gap-0 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
        {/* Top color band with Islamic 8-point star tessellation */}
        <div className={`relative h-16 w-full bg-gradient-to-r ${gradient}`}>
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.1]"
            aria-hidden="true"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='30' height='30' viewBox='0 0 30 30'><g fill='none' stroke='white' stroke-width='0.9'><polygon points='15,2 18,10 26,10 20,15 22,23 15,19 8,23 10,15 4,10 12,10'/></g></svg>\")",
              backgroundSize: "30px 30px",
              backgroundRepeat: "repeat",
            }}
          />
          {/* Soft glow accent */}
          <div
            className="pointer-events-none absolute -end-4 -top-4 size-20 rounded-full bg-white/15 blur-xl transition-transform group-hover:scale-125"
            aria-hidden="true"
          />
        </div>

        <div className="px-4 pb-4 -mt-8">
          <div className="flex items-end justify-between">
            <Avatar className="size-16 ring-4 ring-background">
              {teacher.photoUrl ? <AvatarImage src={teacher.photoUrl} alt={teacher.name} /> : null}
              <AvatarFallback className={`bg-gradient-to-br ${gradient} text-white text-lg font-semibold`}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex gap-1 mb-1">
              <Button size="icon" variant="ghost" className="size-8" onClick={onEdit} aria-label={t("common.edit")}>
                <Pencil className="size-4" />
              </Button>
              <Button size="icon" variant="ghost" className="size-8 text-destructive hover:text-destructive" onClick={onDelete} aria-label={t("common.delete")}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          </div>

          <div className="mt-3">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-base leading-tight">{teacher.name}</h3>
              <Badge
                variant={teacher.isActive ? "default" : "secondary"}
                className={
                  teacher.isActive
                    ? "text-[10px] px-1.5 py-0 bg-emerald-100 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                    : "text-[10px] px-1.5 py-0 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                }
              >
                {teacher.isActive ? t("teachers.active") : t("teachers.inactive")}
              </Badge>
            </div>
            {teacher.nameArabic && (
              <p dir="rtl" lang="ar" className="text-sm text-muted-foreground mt-0.5">
                {teacher.nameArabic}
              </p>
            )}
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              {teacher.designation && (
                <Badge variant="outline" className="text-[10px]">
                  {t(`teachers.designation${cap(teacher.designation)}`)}
                </Badge>
              )}
              <Badge variant="secondary" className="text-[10px]">
                {t(`teachers.spec${cap(spec)}`)}
              </Badge>
            </div>
          </div>

          <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
            {teacher.phone && (
              <div className="flex items-center gap-2">
                <Phone className="size-3.5 shrink-0" />
                <span className="truncate" dir="ltr">{teacher.phone}</span>
              </div>
            )}
            {teacher.email && (
              <div className="flex items-center gap-2">
                <Mail className="size-3.5 shrink-0" />
                <span className="truncate">{teacher.email}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <CalendarDays className="size-3.5 shrink-0" />
              <span>{t("teachers.joinedOn")} {joinDate}</span>
            </div>
            {teacher.address && (
              <div className="flex items-center gap-2">
                <MapPin className="size-3.5 shrink-0" />
                <span className="truncate">{teacher.address}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="text-xs text-muted-foreground">{t("teachers.monthlySalary")}</span>
            <span className="font-semibold text-sm">
              {currency} {Number(teacher.salary || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

export function TeachersEmptyState({
  filtered, onAdd,
}: { filtered: boolean; onAdd: () => void }) {
  const { t } = useApp();
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-4">
      <div className="relative mb-4 grid size-16 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.15]"
          aria-hidden="true"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'><g fill='none' stroke='white' stroke-width='1'><polygon points='20,3 25,14 36,14 27,22 31,33 20,27 9,33 13,22 4,14 15,14'/></g></svg>\")",
            backgroundSize: "40px 40px",
            backgroundRepeat: "repeat",
          }}
        />
        <Users className="relative size-8 drop-shadow-sm" />
      </div>
      <h3 className="text-lg font-semibold">
        {filtered ? t("teachers.emptyFiltered") : t("teachers.empty")}
      </h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">
        {filtered ? t("teachers.emptyFilteredDesc") : t("teachers.emptyDesc")}
      </p>
      {!filtered && (
        <Button
          onClick={onAdd}
          className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
        >
          {t("teachers.add")}
        </Button>
      )}
    </div>
  );
}
