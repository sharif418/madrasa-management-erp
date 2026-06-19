"use client";
// Student Add/Edit dialog with three-section form
import { useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useClasses, useCreateStudent, useUpdateStudent } from "./use-students";
import { useT } from "./i18n";
import { BasicInfoFields, GuardianInfoFields, AdditionalInfoFields } from "./student-form-fields";
import type { Student, StudentInput } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student?: Student | null; // when present => edit mode
};

const emptyInput: StudentInput = {
  name: "", nameArabic: "", rollNo: "", gender: "male", dob: "",
  phone: "", guardianName: "", guardianPhone: "", guardianRelation: undefined,
  address: "", bloodGroup: "", classId: "", isHafiz: false, isZakatEligible: false,
};

function toInput(student: Student): StudentInput {
  return {
    name: student.name,
    nameArabic: student.nameArabic ?? "",
    rollNo: student.rollNo ?? "",
    gender: student.gender,
    dob: student.dob ? new Date(student.dob).toISOString().slice(0, 10) : "",
    phone: student.phone ?? "",
    guardianName: student.guardianName ?? "",
    guardianPhone: student.guardianPhone ?? "",
    guardianRelation: student.guardianRelation ?? undefined,
    address: student.address ?? "",
    bloodGroup: student.bloodGroup ?? "",
    classId: student.classId ?? "",
    isHafiz: student.isHafiz,
    isZakatEligible: student.isZakatEligible,
  };
}

// Inner form — mounted fresh by parent (via key) so initial useState is correct.
function StudentFormInner({ open, onOpenChange, student }: Props) {
  const t = useT();
  const { toast } = useToast();
  const { data: classes = [], isLoading: classesLoading } = useClasses();
  const createMut = useCreateStudent();
  const updateMut = useUpdateStudent();

  const isEdit = !!student;
  const [input, setInput] = useState<StudentInput>(student ? toInput(student) : emptyInput);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("basic");

  const onChange = (patch: Partial<StudentInput>) => {
    setInput((prev) => ({ ...prev, ...patch }));
    if (patch.name !== undefined && errors.name) {
      setErrors((e) => ({ ...e, name: "" }));
    }
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!input.name?.trim()) e.name = t("students.required");
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setActiveTab("basic");
      return;
    }
    const payload: StudentInput = { ...input };
    // Clean empties
    Object.keys(payload).forEach((k) => {
      const key = k as keyof StudentInput;
      if (payload[key] === "" || payload[key] === undefined) {
        (payload as Record<string, unknown>)[key] = undefined;
      }
    });

    try {
      if (isEdit && student) {
        await updateMut.mutateAsync({ id: student.id, input: payload });
        toast({ title: t("students.updateSuccess") });
      } else {
        await createMut.mutateAsync({ ...payload, name: payload.name!.trim() });
        toast({ title: t("students.createSuccess") });
      }
      onOpenChange(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast({
        title: isEdit ? t("students.updateError") : t("students.createError"),
        description: msg,
        variant: "destructive",
      });
    }
  };

  const submitting = createMut.isPending || updateMut.isPending;

  return (
    <Dialog open={open} onOpenChange={(o) => !submitting && onOpenChange(o)}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t("students.edit") : t("students.add")}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {isEdit ? t("students.edit") : t("students.add")}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">{t("students.basicInfo")}</TabsTrigger>
            <TabsTrigger value="guardian">{t("students.guardianInfo")}</TabsTrigger>
            <TabsTrigger value="additional">{t("students.additionalInfo")}</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="mt-4">
            <BasicInfoFields value={input} onChange={onChange} errors={errors} classes={classes} />
          </TabsContent>

          <TabsContent value="guardian" className="mt-4">
            <GuardianInfoFields value={input} onChange={onChange} errors={errors} classes={classes} />
          </TabsContent>

          <TabsContent value="additional" className="mt-4">
            <AdditionalInfoFields value={input} onChange={onChange} errors={errors} classes={classes} />
          </TabsContent>
        </Tabs>

        {classesLoading && (
          <p className="text-xs text-muted-foreground">Loading classes…</p>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            {t("common.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("common.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Wrapper that conditionally mounts the inner form so initial state is derived
// from props at mount time (no setState-in-effect needed).
export function StudentForm(props: Props) {
  if (!props.open) return null;
  // key forces a fresh mount whenever the target student changes
  return <StudentFormInner key={props.student?.id ?? "new"} {...props} />;
}

