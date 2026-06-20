// GET /api/hifz/surah-progress?studentId=
// Returns surah-level memorization progress for a student.
// All queries scoped by tenantId from session.
import { db } from "@/lib/db";
import { ok, fail, notFound, withSession } from "@/lib/api";
import { SURAHS, matchSurahName } from "@/lib/quran-data";

export type SurahStatus = "not_started" | "in_progress" | "completed" | "revision";

export type SurahProgressItem = {
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  surahNameBengali: string;
  totalAyahs: number;
  memorizedAyahs: number;
  status: SurahStatus;
  lastPracticed: string | null;
  avgQuality: number;
  recordCount: number;
  revelationType: "meccan" | "medinan";
};

export type SurahProgressResponse = {
  student: { id: string; name: string; nameArabic: string | null; rollNo: string | null; isHafiz: boolean };
  surahs: SurahProgressItem[];
  totalSurahsMemorized: number;
  totalAyahsMemorized: number;
  completionPercent: number;
  byStatus: Record<SurahStatus, number>;
  parasFullyCovered: number[];
};

export const GET = withSession(async ({ session, req }) => {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("studentId");
  if (!studentId) return fail("studentId is required");

  // Verify tenant ownership
  const student = await db.student.findFirst({
    where: { id: studentId, tenantId: session.tenantId },
    select: { id: true, name: true, nameArabic: true, rollNo: true, isHafiz: true },
  });
  if (!student) return notFound("Student not found");

  // Fetch all records (tenant-scoped)
  const records = await db.hifzRecord.findMany({
    where: { studentId, tenantId: session.tenantId },
    orderBy: { recordedAt: "desc" },
    select: {
      id: true, type: true, paraNumber: true, surahName: true,
      ayahFrom: true, ayahTo: true, qualityRating: true,
      mistakesCount: true, status: true, recordedAt: true, notes: true,
    },
  });

  // Bucket records by matched surah number
  type Rec = (typeof records)[number];
  const bySurah = new Map<number, Rec[]>();
  for (const r of records) {
    const sn = matchSurahName(r.surahName);
    if (sn > 0) {
      const arr = bySurah.get(sn) ?? [];
      arr.push(r);
      bySurah.set(sn, arr);
    }
  }

  // Build per-surah progress
  const surahs: SurahProgressItem[] = SURAHS.map((s): SurahProgressItem => {
    const recs = bySurah.get(s.number) ?? [];
    if (recs.length === 0) {
      return {
        surahNumber: s.number, surahName: s.name, surahNameArabic: s.nameArabic,
        surahNameBengali: s.nameBengali, totalAyahs: s.numberOfAyahs,
        memorizedAyahs: 0, status: "not_started", lastPracticed: null,
        avgQuality: 0, recordCount: 0, revelationType: s.revelationType,
      };
    }
    // Union of completed ayah ranges → memorizedAyahs
    const bitset = new Uint8Array(s.numberOfAyahs + 1);
    for (const r of recs) {
      if (r.status !== "completed") continue;
      const from = Math.max(1, r.ayahFrom ?? 1);
      const to = Math.min(s.numberOfAyahs, r.ayahTo ?? s.numberOfAyahs);
      for (let i = from; i <= to; i++) bitset[i] = 1;
    }
    let memorizedAyahs = 0;
    for (let i = 1; i <= s.numberOfAyahs; i++) if (bitset[i]) memorizedAyahs++;

    // Status determination
    const latest = recs[0]; // records sorted desc by recordedAt
    const hasDhorRecent = recs.some((r) => r.type === "dhor" && r.status === "completed");
    const fullyMemorized = memorizedAyahs >= s.numberOfAyahs;
    let status: SurahStatus;
    if (fullyMemorized && hasDhorRecent) status = "revision";
    else if (fullyMemorized) status = "completed";
    else status = "in_progress";

    // Average quality
    const rated = recs.filter((r) => r.qualityRating != null);
    const avgQuality = rated.length > 0
      ? Math.round((rated.reduce((sum, r) => sum + (r.qualityRating ?? 0), 0) / rated.length) * 10) / 10
      : 0;

    return {
      surahNumber: s.number, surahName: s.name, surahNameArabic: s.nameArabic,
      surahNameBengali: s.nameBengali, totalAyahs: s.numberOfAyahs,
      memorizedAyahs, status, lastPracticed: latest.recordedAt.toISOString(),
      avgQuality, recordCount: recs.length, revelationType: s.revelationType,
    };
  });

  // Aggregates
  const completed = surahs.filter((s) => s.status === "completed" || s.status === "revision");
  const totalSurahsMemorized = completed.length;
  const totalAyahsMemorized = surahs.reduce((sum, s) => sum + s.memorizedAyahs, 0);
  const totalAyahsAll = SURAHS.reduce((sum, s) => sum + s.numberOfAyahs, 0);
  const completionPercent = Math.round((totalAyahsMemorized / totalAyahsAll) * 1000) / 10;

  const byStatus: Record<SurahStatus, number> = {
    not_started: 0, in_progress: 0, completed: 0, revision: 0,
  };
  for (const s of surahs) byStatus[s.status]++;

  // Paras fully covered: para is fully covered if every surah spanning it is completed/revision
  const parasFullyCovered: number[] = [];
  for (let p = 1; p <= 30; p++) {
    const spanning = SURAHS.filter((s) => s.paraNumbers.includes(p));
    if (spanning.length === 0) continue;
    const allDone = spanning.every((s) => {
      const item = surahs.find((x) => x.surahNumber === s.number);
      return item && (item.status === "completed" || item.status === "revision");
    });
    if (allDone) parasFullyCovered.push(p);
  }

  return ok({
    student: {
      id: student.id, name: student.name, nameArabic: student.nameArabic,
      rollNo: student.rollNo, isHafiz: student.isHafiz,
    },
    surahs,
    totalSurahsMemorized,
    totalAyahsMemorized,
    completionPercent,
    byStatus,
    parasFullyCovered,
  } satisfies SurahProgressResponse);
});
