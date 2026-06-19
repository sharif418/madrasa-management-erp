// Local i18n helper for Students module
// Uses global `useApp.t()` for keys defined in translations.ts and falls back
// to a local dictionary for module-specific strings not yet present globally.
import { useCallback } from "react";
import { useApp } from "@/store/app-store";
import type { Locale } from "@/i18n/translations";

// Module-local translations for keys not present in src/i18n/translations.ts
const localDict: Record<Locale, Record<string, string>> = {
  en: {
    "students.search": "Search by name, roll, phone...",
    "students.filterClass": "Filter by class",
    "students.filterGender": "Filter by gender",
    "students.allClasses": "All Classes",
    "students.allGenders": "All Genders",
    "students.noStudents": "No students found",
    "students.noStudentsDesc": "Add your first student to get started.",
    "students.confirmDelete": "Delete Student?",
    "students.confirmDeleteMsg": "Are you sure you want to delete \"{name}\"? This action cannot be undone.",
    "students.createSuccess": "Student created successfully",
    "students.updateSuccess": "Student updated successfully",
    "students.deleteSuccess": "Student deleted",
    "students.createError": "Failed to create student",
    "students.updateError": "Failed to update student",
    "students.deleteError": "Failed to delete student",
    "students.loadError": "Failed to load students",
    "students.pageOf": "Page {page} of {total}",
    "students.totalRows": "{count} students",
    "students.new": "New Student",
    "students.required": "required",
    "students.optional": "optional",
    "students.basicInfo": "Basic Information",
    "students.guardianInfo": "Guardian Information",
    "students.additionalInfo": "Additional Information",
    "students.father": "Father",
    "students.mother": "Mother",
    "students.uncle": "Uncle",
    "students.other": "Other",
    "students.activeStatus": "Active",
    "students.view": "View",
    "students.edit": "Edit",
    "students.delete": "Delete",
    "students.next": "Next",
    "students.prev": "Previous",
    "students.first": "First",
    "students.last": "Last",
  },
  bn: {
    "students.search": "নাম, রোল, ফোন দিয়ে খুঁজুন...",
    "students.filterClass": "ক্লাস অনুযায়ী ফিল্টার",
    "students.filterGender": "লিঙ্গ অনুযায়ী ফিল্টার",
    "students.allClasses": "সব ক্লাস",
    "students.allGenders": "সব লিঙ্গ",
    "students.noStudents": "কোন ছাত্র পাওয়া যায়নি",
    "students.noStudentsDesc": "শুরু করতে আপনার প্রথম ছাত্র যোগ করুন।",
    "students.confirmDelete": "ছাত্র মুছবেন?",
    "students.confirmDeleteMsg": "আপনি কি \"{name}\" মুছতে চান? এটি ফিরিয়ে আনা যাবে না।",
    "students.createSuccess": "ছাত্র সফলভাবে তৈরি হয়েছে",
    "students.updateSuccess": "ছাত্র সফলভাবে আপডেট হয়েছে",
    "students.deleteSuccess": "ছাত্র মুছে ফেলা হয়েছে",
    "students.createError": "ছাত্র তৈরি ব্যর্থ",
    "students.updateError": "ছাত্র আপডেট ব্যর্থ",
    "students.deleteError": "ছাত্র মুছতে ব্যর্থ",
    "students.loadError": "ছাত্র লোড ব্যর্থ",
    "students.pageOf": "পৃষ্ঠা {page} / {total}",
    "students.totalRows": "{count} জন ছাত্র",
    "students.new": "নতুন ছাত্র",
    "students.required": "আবশ্যক",
    "students.optional": "ঐচ্ছিক",
    "students.basicInfo": "মৌলিক তথ্য",
    "students.guardianInfo": "অভিভাবকের তথ্য",
    "students.additionalInfo": "অতিরিক্ত তথ্য",
    "students.father": "পিতা",
    "students.mother": "মাতা",
    "students.uncle": "চাচা",
    "students.other": "অন্যান্য",
    "students.activeStatus": "সক্রিয়",
    "students.view": "দেখুন",
    "students.edit": "সম্পাদনা",
    "students.delete": "মুছুন",
    "students.next": "পরবর্তী",
    "students.prev": "পূর্ববর্তী",
    "students.first": "প্রথম",
    "students.last": "শেষ",
  },
  ar: {
    "students.search": "ابحث بالاسم أو الرقم أو الهاتف...",
    "students.filterClass": "تصفية حسب الفصل",
    "students.filterGender": "تصفية حسب الجنس",
    "students.allClasses": "كل الفصول",
    "students.allGenders": "كل الأجناس",
    "students.noStudents": "لم يتم العثور على طلاب",
    "students.noStudentsDesc": "أضف أول طالب للبدء.",
    "students.confirmDelete": "حذف الطالب؟",
    "students.confirmDeleteMsg": "هل أنت متأكد من حذف \"{name}\"؟ لا يمكن التراجع عن هذا الإجراء.",
    "students.createSuccess": "تم إنشاء الطالب بنجاح",
    "students.updateSuccess": "تم تحديث الطالب بنجاح",
    "students.deleteSuccess": "تم حذف الطالب",
    "students.createError": "فشل إنشاء الطالب",
    "students.updateError": "فشل تحديث الطالب",
    "students.deleteError": "فشل حذف الطالب",
    "students.loadError": "فشل تحميل الطلاب",
    "students.pageOf": "صفحة {page} من {total}",
    "students.totalRows": "{count} طالب",
    "students.new": "طالب جديد",
    "students.required": "مطلوب",
    "students.optional": "اختياري",
    "students.basicInfo": "المعلومات الأساسية",
    "students.guardianInfo": "معلومات ولي الأمر",
    "students.additionalInfo": "معلومات إضافية",
    "students.father": "الأب",
    "students.mother": "الأم",
    "students.uncle": "العم",
    "students.other": "أخرى",
    "students.activeStatus": "نشط",
    "students.view": "عرض",
    "students.edit": "تعديل",
    "students.delete": "حذف",
    "students.next": "التالي",
    "students.prev": "السابق",
    "students.first": "الأول",
    "students.last": "الأخير",
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
      // Try global first (handles param substitution)
      const fromGlobal = t(key, params);
      if (fromGlobal && fromGlobal !== key) return fromGlobal;

      // Try local dict
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

// Non-hook version for one-off translations
export function tr(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
) {
  let str = localDict[locale]?.[key] ?? localDict.en[key] ?? key;
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return str;
}
