// Local i18n helper for the Academic module
// Prefers global `useApp.t()` (which already has academic.* keys), falls back to local dict.
import { useCallback } from "react";
import { useApp } from "@/store/app-store";
import type { Locale } from "@/i18n/translations";

const localDict: Record<Locale, Record<string, string>> = {
  en: {
    "academic.tabs.classes": "Classes",
    "academic.tabs.subjects": "Subjects",
    "academic.subtitle": "Manage classes, curriculum & subjects",
    "academic.addClassShort": "Add Class",
    "academic.addSubjectShort": "Add Subject",
    "academic.editClass": "Edit Class",
    "academic.editSubject": "Edit Subject",
    "academic.newClass": "New Class",
    "academic.newSubject": "New Subject",
    "academic.studentsEnrolled": "{count} students",
    "academic.noStudentsEnrolled": "No students",
    "academic.levelLabel": "Level {n}",
    "academic.enrolled": "Enrolled",
    "academic.filterType": "Type",
    "academic.filterClass": "Class",
    "academic.allTypes": "All Types",
    "academic.allClasses": "All Classes",
    "academic.noClass": "No class",
    "academic.emptyClasses": "No classes yet",
    "academic.emptyClassesDesc": "Create your first class to start enrolling students.",
    "academic.emptySubjects": "No subjects found",
    "academic.emptySubjectsDesc": "Add your first subject to start managing the curriculum.",
    "academic.emptySubjectsFiltered": "No subjects match your filters",
    "academic.loadFailed": "Failed to load data",
    "academic.nameRequired": "Name is required",
    "academic.capacityRequired": "Capacity must be greater than 0",
    "academic.createSuccess": "Created successfully",
    "academic.updateSuccess": "Updated successfully",
    "academic.deleteSuccess": "Deleted successfully",
    "academic.createFailed": "Failed to create",
    "academic.updateFailed": "Failed to update",
    "academic.deleteFailed": "Failed to delete",
    "academic.confirmDelete": "Delete?",
    "academic.confirmDeleteClass": "Delete class \"{name}\"? This cannot be undone.",
    "academic.confirmDeleteSubject": "Delete subject \"{name}\"? This cannot be undone.",
    "academic.saving": "Saving...",
    "academic.deleting": "Deleting...",
    "academic.classHasStudents": "Cannot delete a class with enrolled students",
    "academic.searchClass": "Search classes...",
    "academic.searchSubject": "Search subjects...",
  },
  bn: {
    "academic.tabs.classes": "ক্লাস",
    "academic.tabs.subjects": "বিষয়",
    "academic.subtitle": "ক্লাস, কারিকুলাম ও বিষয় পরিচালনা",
    "academic.addClassShort": "ক্লাস যোগ করুন",
    "academic.addSubjectShort": "বিষয় যোগ করুন",
    "academic.editClass": "ক্লাস সম্পাদনা",
    "academic.editSubject": "বিষয় সম্পাদনা",
    "academic.newClass": "নতুন ক্লাস",
    "academic.newSubject": "নতুন বিষয়",
    "academic.studentsEnrolled": "{count} জন ছাত্র",
    "academic.noStudentsEnrolled": "কোন ছাত্র নেই",
    "academic.levelLabel": "স্তর {n}",
    "academic.enrolled": "নামভুক্ত",
    "academic.filterType": "ধরন",
    "academic.filterClass": "ক্লাস",
    "academic.allTypes": "সব ধরন",
    "academic.allClasses": "সব ক্লাস",
    "academic.noClass": "ক্লাস নেই",
    "academic.emptyClasses": "এখনও কোন ক্লাস নেই",
    "academic.emptyClassesDesc": "ছাত্র ভর্তি শুরু করতে আপনার প্রথম ক্লাস তৈরি করুন।",
    "academic.emptySubjects": "কোন বিষয় পাওয়া যায়নি",
    "academic.emptySubjectsDesc": "কারিকুলাম ব্যবস্থাপনা শুরু করতে আপনার প্রথম বিষয় যোগ করুন।",
    "academic.emptySubjectsFiltered": "আপনার ফিল্টারে কোন বিষয় নেই",
    "academic.loadFailed": "তথ্য লোড ব্যর্থ",
    "academic.nameRequired": "নাম আবশ্যক",
    "academic.capacityRequired": "ধারণক্ষমতা ০-এর বেশি হতে হবে",
    "academic.createSuccess": "সফলভাবে তৈরি হয়েছে",
    "academic.updateSuccess": "সফলভাবে আপডেট হয়েছে",
    "academic.deleteSuccess": "সফলভাবে মুছে ফেলা হয়েছে",
    "academic.createFailed": "তৈরি ব্যর্থ",
    "academic.updateFailed": "আপডেট ব্যর্থ",
    "academic.deleteFailed": "মুছতে ব্যর্থ",
    "academic.confirmDelete": "মুছবেন?",
    "academic.confirmDeleteClass": "\"{name}\" ক্লাস মুছবেন? এটি ফিরিয়ে আনা যাবে না।",
    "academic.confirmDeleteSubject": "\"{name}\" বিষয় মুছবেন? এটি ফিরিয়ে আনা যাবে না।",
    "academic.saving": "সংরক্ষণ হচ্ছে...",
    "academic.deleting": "মুছছে...",
    "academic.classHasStudents": "ছাত্র নামভুক্ত ক্লাস মুছা যায় না",
    "academic.searchClass": "ক্লাস খুঁজুন...",
    "academic.searchSubject": "বিষয় খুঁজুন...",
  },
  ar: {
    "academic.tabs.classes": "الفصول",
    "academic.tabs.subjects": "المواد",
    "academic.subtitle": "إدارة الفصول والمناهج والمواد",
    "academic.addClassShort": "إضافة فصل",
    "academic.addSubjectShort": "إضافة مادة",
    "academic.editClass": "تعديل الفصل",
    "academic.editSubject": "تعديل المادة",
    "academic.newClass": "فصل جديد",
    "academic.newSubject": "مادة جديدة",
    "academic.studentsEnrolled": "{count} طالب",
    "academic.noStudentsEnrolled": "لا طلاب",
    "academic.levelLabel": "المستوى {n}",
    "academic.enrolled": "مسجل",
    "academic.filterType": "النوع",
    "academic.filterClass": "الفصل",
    "academic.allTypes": "كل الأنواع",
    "academic.allClasses": "كل الفصول",
    "academic.noClass": "لا فصل",
    "academic.emptyClasses": "لا فصول بعد",
    "academic.emptyClassesDesc": "أنشئ أول فصل لبدء تسجيل الطلاب.",
    "academic.emptySubjects": "لم يتم العثور على مواد",
    "academic.emptySubjectsDesc": "أضف مادة أولى لبدء إدارة المنهج.",
    "academic.emptySubjectsFiltered": "لا مواد تطابق عوامل التصفية",
    "academic.loadFailed": "فشل تحميل البيانات",
    "academic.nameRequired": "الاسم مطلوب",
    "academic.capacityRequired": "يجب أن تكون السعة أكبر من 0",
    "academic.createSuccess": "تم الإنشاء بنجاح",
    "academic.updateSuccess": "تم التحديث بنجاح",
    "academic.deleteSuccess": "تم الحذف بنجاح",
    "academic.createFailed": "فشل الإنشاء",
    "academic.updateFailed": "فشل التحديث",
    "academic.deleteFailed": "فشل الحذف",
    "academic.confirmDelete": "حذف؟",
    "academic.confirmDeleteClass": "حذف الفصل \"{name}\"؟ لا يمكن التراجع عن هذا.",
    "academic.confirmDeleteSubject": "حذف المادة \"{name}\"؟ لا يمكن التراجع عن هذا.",
    "academic.saving": "جارٍ الحفظ...",
    "academic.deleting": "جارٍ الحذف...",
    "academic.classHasStudents": "لا يمكن حذف فصل به طلاب مسجلون",
    "academic.searchClass": "ابحث عن فصل...",
    "academic.searchSubject": "ابحث عن مادة...",
  },
};

// Hook returning a translator that prefers global dict, then local dict, then key.
// Memoized with useCallback so callers can safely use the returned `t` as a
// dependency in their own useCallback/useEffect without causing infinite
// re-render loops.
export function useT() {
  const t = useApp((s) => s.t);
  const locale = useApp((s) => s.locale);

  return useCallback(
    (key: string, params?: Record<string, string | number>) => {
      const fromGlobal = t(key, params);
      if (fromGlobal && fromGlobal !== key) return fromGlobal;

      let str = localDict[locale]?.[key] ?? localDict.en[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
        }
      }
      return str;
    },
    [t, locale]
  );
}
