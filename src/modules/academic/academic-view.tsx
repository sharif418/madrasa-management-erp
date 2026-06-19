"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Plus, Search, GraduationCap, BookOpenText,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from "@/store/app-store";

import { useT } from "./i18n";
import {
  SUBJECT_TYPES,
  type ClassDTO, type ClassOption, type SubjectDTO,
} from "./types";
import { ClassesGrid } from "./classes-grid";
import { ClassForm } from "./class-form";
import { SubjectsTable } from "./subjects-table";
import { SubjectForm } from "./subject-form";
import { ClassesSkeleton, SubjectsSkeleton } from "./academic-skeletons";

type Tab = "classes" | "subjects";

export function AcademicView() {
  const t = useT();
  const { dir, tenantName } = useApp();
  const [tab, setTab] = useState<Tab>("classes");

  // Classes state
  const [classes, setClasses] = useState<ClassDTO[]>([]);
  const [classSearch, setClassSearch] = useState("");
  const [debouncedClassSearch, setDebouncedClassSearch] = useState("");
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [classFormOpen, setClassFormOpen] = useState(false);
  const [editClass, setEditClass] = useState<ClassDTO | null>(null);

  // Subjects state
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [subjectSearch, setSubjectSearch] = useState("");
  const [debouncedSubjectSearch, setDebouncedSubjectSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [classFilter, setClassFilter] = useState<string>("all");
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectFormOpen, setSubjectFormOpen] = useState(false);
  const [editSubject, setEditSubject] = useState<SubjectDTO | null>(null);

  // Debounce search inputs
  useEffect(() => {
    const id = setTimeout(() => setDebouncedClassSearch(classSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [classSearch]);

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSubjectSearch(subjectSearch.trim()), 300);
    return () => clearTimeout(id);
  }, [subjectSearch]);

  const classOptions: ClassOption[] = useMemo(
    () => classes.map((c) => ({ id: c.id, name: c.name })),
    [classes]
  );

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);
    try {
      const params = new URLSearchParams();
      if (debouncedClassSearch) params.set("search", debouncedClassSearch);
      const res = await fetch(`/api/academic/classes?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setClasses(json.data.items as ClassDTO[]);
    } catch (err) {
      toast.error(t("academic.loadFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
      setClasses([]);
    } finally {
      setLoadingClasses(false);
    }
  }, [debouncedClassSearch, t]);

  const loadSubjects = useCallback(async () => {
    setLoadingSubjects(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter !== "all") params.set("type", typeFilter);
      if (classFilter !== "all") params.set("classId", classFilter);
      if (debouncedSubjectSearch) params.set("search", debouncedSubjectSearch);
      const res = await fetch(`/api/academic/subjects?${params.toString()}`, {
        cache: "no-store",
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "Failed");
      setSubjects(json.data.items as SubjectDTO[]);
    } catch (err) {
      toast.error(t("academic.loadFailed"), {
        description: err instanceof Error ? err.message : "Failed",
      });
      setSubjects([]);
    } finally {
      setLoadingSubjects(false);
    }
  }, [typeFilter, classFilter, debouncedSubjectSearch, t]);

  useEffect(() => {
    void loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    void loadSubjects();
  }, [loadSubjects]);

  // When class filter references a deleted class, reset
  useEffect(() => {
    if (classFilter !== "all" && !classes.some((c) => c.id === classFilter)) {
      setClassFilter("all");
    }
  }, [classes, classFilter]);

  const handleAddClass = () => {
    setEditClass(null);
    setClassFormOpen(true);
  };
  const handleEditClass = (cls: ClassDTO) => {
    setEditClass(cls);
    setClassFormOpen(true);
  };

  const handleAddSubject = () => {
    setEditSubject(null);
    setSubjectFormOpen(true);
  };
  const handleEditSubject = (s: SubjectDTO) => {
    setEditSubject(s);
    setSubjectFormOpen(true);
  };

  const hasSubjectFilters =
    !!debouncedSubjectSearch || typeFilter !== "all" || classFilter !== "all";
  const hasClassFilters = !!debouncedClassSearch;

  return (
    <div className="flex flex-col gap-6" dir={dir()}>
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="relative grid size-12 place-items-center overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-600/20 ring-1 ring-white/30">
            {/* Islamic geometric pattern overlay */}
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
            <GraduationCap className="relative size-6 drop-shadow-sm" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("academic.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("academic.subtitle")}
              {tenantName ? ` · ${tenantName}` : ""}
            </p>
          </div>
        </div>
        <Button
          onClick={tab === "classes" ? handleAddClass : handleAddSubject}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700"
        >
          <Plus className="size-4" />
          {tab === "classes" ? t("academic.addClassShort") : t("academic.addSubjectShort")}
        </Button>
      </header>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
        <TabsList>
          <TabsTrigger value="classes">
            <GraduationCap className="size-4" />
            {t("academic.tabs.classes")}
            <span className="ms-1 text-xs text-muted-foreground">({classes.length})</span>
          </TabsTrigger>
          <TabsTrigger value="subjects">
            <BookOpenText className="size-4" />
            {t("academic.tabs.subjects")}
            <span className="ms-1 text-xs text-muted-foreground">({subjects.length})</span>
          </TabsTrigger>
        </TabsList>

        {/* Classes tab */}
        <TabsContent value="classes" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="relative sm:max-w-sm">
              <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground pointer-events-none" />
              <Input
                value={classSearch}
                onChange={(e) => setClassSearch(e.target.value)}
                placeholder={t("academic.searchClass")}
                className="ps-9"
              />
            </div>

            {loadingClasses ? (
              <ClassesSkeleton />
            ) : (
              <ClassesGrid
                classes={classes}
                onEdit={handleEditClass}
                onChanged={loadClasses}
                onAdd={handleAddClass}
                hasFilters={hasClassFilters}
              />
            )}
          </div>
        </TabsContent>

        {/* Subjects tab */}
        <TabsContent value="subjects" className="mt-4">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 -translate-y-1/2 start-3 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={subjectSearch}
                  onChange={(e) => setSubjectSearch(e.target.value)}
                  placeholder={t("academic.searchSubject")}
                  className="ps-9"
                />
              </div>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="sm:w-44 w-full">
                  <SelectValue placeholder={t("academic.filterType")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("academic.allTypes")}</SelectItem>
                  {SUBJECT_TYPES.map((s) => (
                    <SelectItem key={s} value={s}>{t(`academic.${s}`)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={classFilter} onValueChange={setClassFilter}>
                <SelectTrigger className="sm:w-48 w-full">
                  <SelectValue placeholder={t("academic.filterClass")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("academic.allClasses")}</SelectItem>
                  {classOptions.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {loadingSubjects ? (
              <SubjectsSkeleton />
            ) : (
              <SubjectsTable
                subjects={subjects}
                classes={classOptions}
                onEdit={handleEditSubject}
                onChanged={loadSubjects}
                onAdd={handleAddSubject}
                hasFilters={hasSubjectFilters}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <ClassForm
        open={classFormOpen}
        onOpenChange={setClassFormOpen}
        classEntity={editClass}
        onSaved={loadClasses}
      />
      <SubjectForm
        open={subjectFormOpen}
        onOpenChange={setSubjectFormOpen}
        subject={editSubject}
        classes={classOptions}
        onSaved={loadSubjects}
      />
    </div>
  );
}
