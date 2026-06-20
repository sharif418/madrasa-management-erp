// Quran reference data — all 114 surahs.
// First 20 surahs include full detail (Bengali name, revelationType, paras).
// Surahs 21-114 include name + ayah count + para range.
// Source: standard Tanzil / King Fahd Quran Complex figures.

export type RevelationType = "meccan" | "medinan";

export type Surah = {
  number: number;
  name: string; // English transliteration
  nameArabic: string;
  nameBengali: string;
  numberOfAyahs: number;
  revelationType: RevelationType;
  paraNumbers: number[]; // which paras (1-30) this surah spans
};

// Helper to expand a contiguous para range into an array.
function paras(from: number, to: number = from): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i++) out.push(i);
  return out;
}

// --- First 20 surahs (full detail) ---
const DETAIL: Surah[] = [
  { number: 1, name: "Al-Fatiha", nameArabic: "الفاتحة", nameBengali: "আল-ফাতিহা", numberOfAyahs: 7, revelationType: "meccan", paraNumbers: paras(1) },
  { number: 2, name: "Al-Baqarah", nameArabic: "البقرة", nameBengali: "আল-বাকারা", numberOfAyahs: 286, revelationType: "medinan", paraNumbers: paras(1, 3) },
  { number: 3, name: "Aal-E-Imran", nameArabic: "آل عمران", nameBengali: "আলে-ইমরান", numberOfAyahs: 200, revelationType: "medinan", paraNumbers: paras(3, 4) },
  { number: 4, name: "An-Nisa", nameArabic: "النساء", nameBengali: "আন-নিসা", numberOfAyahs: 176, revelationType: "medinan", paraNumbers: paras(4, 6) },
  { number: 5, name: "Al-Maidah", nameArabic: "المائدة", nameBengali: "আল-মায়িদা", numberOfAyahs: 120, revelationType: "medinan", paraNumbers: paras(6, 7) },
  { number: 6, name: "Al-Anam", nameArabic: "الأنعام", nameBengali: "আল-আনআম", numberOfAyahs: 165, revelationType: "meccan", paraNumbers: paras(7, 8) },
  { number: 7, name: "Al-Araf", nameArabic: "الأعراف", nameBengali: "আল-আরাফ", numberOfAyahs: 206, revelationType: "meccan", paraNumbers: paras(8, 9) },
  { number: 8, name: "Al-Anfal", nameArabic: "الأنفال", nameBengali: "আল-আনফাল", numberOfAyahs: 75, revelationType: "medinan", paraNumbers: paras(9, 10) },
  { number: 9, name: "At-Tawbah", nameArabic: "التوبة", nameBengali: "আত-তাওবা", numberOfAyahs: 129, revelationType: "medinan", paraNumbers: paras(10, 11) },
  { number: 10, name: "Yunus", nameArabic: "يونس", nameBengali: "ইউনুস", numberOfAyahs: 109, revelationType: "meccan", paraNumbers: paras(11) },
  { number: 11, name: "Hud", nameArabic: "هود", nameBengali: "হুদ", numberOfAyahs: 123, revelationType: "meccan", paraNumbers: paras(11, 12) },
  { number: 12, name: "Yusuf", nameArabic: "يوسف", nameBengali: "ইউসুফ", numberOfAyahs: 111, revelationType: "meccan", paraNumbers: paras(12, 13) },
  { number: 13, name: "Ar-Rad", nameArabic: "الرعد", nameBengali: "আর-রাদ", numberOfAyahs: 43, revelationType: "medinan", paraNumbers: paras(13) },
  { number: 14, name: "Ibrahim", nameArabic: "إبراهيم", nameBengali: "ইব্রাহিম", numberOfAyahs: 52, revelationType: "meccan", paraNumbers: paras(13) },
  { number: 15, name: "Al-Hijr", nameArabic: "الحجر", nameBengali: "আল-হিজর", numberOfAyahs: 99, revelationType: "meccan", paraNumbers: paras(14) },
  { number: 16, name: "An-Nahl", nameArabic: "النحل", nameBengali: "আন-নাহল", numberOfAyahs: 128, revelationType: "meccan", paraNumbers: paras(14) },
  { number: 17, name: "Al-Isra", nameArabic: "الإسراء", nameBengali: "আল-ইসরা", numberOfAyahs: 111, revelationType: "meccan", paraNumbers: paras(15) },
  { number: 18, name: "Al-Kahf", nameArabic: "الكهف", nameBengali: "আল-কাহফ", numberOfAyahs: 110, revelationType: "meccan", paraNumbers: paras(15, 16) },
  { number: 19, name: "Maryam", nameArabic: "مريم", nameBengali: "মারইয়াম", numberOfAyahs: 98, revelationType: "meccan", paraNumbers: paras(16) },
  { number: 20, name: "Taha", nameArabic: "طه", nameBengali: "ত্বহা", numberOfAyahs: 135, revelationType: "meccan", paraNumbers: paras(16) },
];

// --- Surahs 21-114 (compact tuples) ---
// [number, name, nameArabic, nameBengali, ayahs, type, paraFrom, paraTo?]
type Tuple = [number, string, string, string, number, RevelationType, number, number?];
const COMPACT: Tuple[] = [
  [21, "Al-Anbiya", "الأنبياء", "আল-আম্বিয়া", 112, "meccan", 17],
  [22, "Al-Hajj", "الحج", "আল-হাজ্জ", 78, "medinan", 17],
  [23, "Al-Muminun", "المؤمنون", "আল-মুমিনুন", 118, "meccan", 17, 18],
  [24, "An-Nur", "النور", "আন-নূর", 64, "medinan", 18, 19],
  [25, "Al-Furqan", "الفرقان", "আল-ফুরকান", 77, "meccan", 18, 19],
  [26, "Ash-Shuara", "الشعراء", "আশ-শুআরা", 227, "meccan", 19, 20],
  [27, "An-Naml", "النمل", "আন-নামল", 93, "meccan", 19, 20],
  [28, "Al-Qasas", "القصص", "আল-কাসাস", 88, "meccan", 20, 21],
  [29, "Al-Ankabut", "العنكبوت", "আল-আনকাবুত", 69, "meccan", 20, 21],
  [30, "Ar-Rum", "الروم", "আর-রূম", 60, "meccan", 21],
  [31, "Luqman", "لقمان", "লুকমান", 34, "meccan", 21],
  [32, "As-Sajdah", "السجدة", "আস-সাজদা", 30, "meccan", 21],
  [33, "Al-Ahzab", "الأحزاب", "আল-আহযাব", 73, "medinan", 21, 22],
  [34, "Saba", "سبأ", "সাবা", 54, "meccan", 22],
  [35, "Fatir", "فاطر", "ফাতির", 45, "meccan", 22],
  [36, "Ya-Sin", "يس", "ইয়াসিন", 83, "meccan", 22, 23],
  [37, "As-Saffat", "الصافات", "আস-সাফফাত", 182, "meccan", 23],
  [38, "Sad", "ص", "সাদ", 88, "meccan", 23],
  [39, "Az-Zumar", "الزمر", "আয-যুমার", 75, "meccan", 23, 24],
  [40, "Ghafir", "غافر", "গাফির", 85, "meccan", 24],
  [41, "Fussilat", "فصلت", "ফুসসিলাত", 54, "meccan", 24, 25],
  [42, "Ash-Shura", "الشورى", "আশ-শূরা", 53, "meccan", 25, 26],
  [43, "Az-Zukhruf", "الزخرف", "আয-যুখরুফ", 89, "meccan", 25, 26],
  [44, "Ad-Dukhan", "الدخان", "আদ-দুখান", 59, "meccan", 26],
  [45, "Al-Jathiyah", "الجاثية", "আল-জাসিয়া", 37, "meccan", 26],
  [46, "Al-Ahqaf", "الأحقاف", "আল-আহকাফ", 35, "meccan", 26, 27],
  [47, "Muhammad", "محمد", "মুহাম্মাদ", 38, "medinan", 26, 27],
  [48, "Al-Fath", "الفتح", "আল-ফাতহ", 29, "medinan", 26, 27],
  [49, "Al-Hujurat", "الحجرات", "আল-হুজুরাত", 18, "medinan", 26, 27],
  [50, "Qaf", "ق", "ক্বাফ", 45, "meccan", 26, 27],
  [51, "Adh-Dhariyat", "الذاريات", "আয-যারিয়াত", 60, "meccan", 26, 27],
  [52, "At-Tur", "الطور", "আত-তূর", 49, "meccan", 27],
  [53, "An-Najm", "النجم", "আন-নাজম", 62, "meccan", 27],
  [54, "Al-Qamar", "القمر", "আল-কামার", 55, "meccan", 27],
  [55, "Ar-Rahman", "الرحمن", "আর-রহমান", 78, "medinan", 27, 28],
  [56, "Al-Waqiah", "الواقعة", "আল-ওয়াকিয়া", 96, "meccan", 27],
  [57, "Al-Hadid", "الحديد", "আল-হাদিদ", 29, "medinan", 27, 28],
  [58, "Al-Mujadila", "المجادلة", "আল-মুজাদিলা", 22, "medinan", 28],
  [59, "Al-Hashr", "الحشر", "আল-হাশর", 24, "medinan", 28],
  [60, "Al-Mumtahanah", "الممتحنة", "আল-মুমতাহিনা", 13, "medinan", 28],
  [61, "As-Saff", "الصف", "আস-সাফফ", 14, "medinan", 28],
  [62, "Al-Jumuah", "الجمعة", "আল-জুমুআ", 11, "medinan", 28],
  [63, "Al-Munafiqun", "المنافقون", "আল-মুনাফিকূন", 11, "medinan", 28],
  [64, "At-Taghabun", "التغابن", "আত-তাগাবুন", 18, "medinan", 28],
  [65, "At-Talaq", "الطلاق", "আত-তালাক", 12, "medinan", 28, 29],
  [66, "At-Tahrim", "التحريم", "আত-তাহরিম", 12, "medinan", 28, 29],
  [67, "Al-Mulk", "الملك", "আল-মুলক", 30, "meccan", 28, 29],
  [68, "Al-Qalam", "القلم", "আল-কলম", 52, "meccan", 29],
  [69, "Al-Haqqah", "الحاقة", "আল-হাক্কা", 52, "meccan", 29],
  [70, "Al-Maarij", "المعارج", "আল-মাআরিজ", 44, "meccan", 29],
  [71, "Nuh", "نوح", "নূহ", 28, "meccan", 29],
  [72, "Al-Jinn", "الجن", "আল-জিন", 28, "meccan", 29],
  [73, "Al-Muzzammil", "المزمل", "আল-মুযযাম্মিল", 20, "meccan", 29],
  [74, "Al-Muddaththir", "المدثر", "আল-মুদ্দাসসির", 56, "meccan", 29],
  [75, "Al-Qiyamah", "القيامة", "আল-কিয়ামা", 40, "meccan", 29],
  [76, "Al-Insan", "الإنسان", "আল-ইনসান", 31, "medinan", 29],
  [77, "Al-Mursalat", "المرسلات", "আল-মুরসালাত", 50, "meccan", 29],
  [78, "An-Naba", "النبأ", "আন-নাবা", 40, "meccan", 30],
  [79, "An-Naziat", "النازعات", "আন-নাযিআত", 46, "meccan", 30],
  [80, "Abasa", "عبس", "আবাসা", 42, "meccan", 30],
  [81, "At-Takwir", "التكوير", "আত-তাকভির", 29, "meccan", 30],
  [82, "Al-Infitar", "الإنفطار", "আল-ইনফিতার", 19, "meccan", 30],
  [83, "Al-Mutaffifin", "المطففين", "আল-মুতাফফিফিন", 36, "meccan", 30],
  [84, "Al-Inshiqaq", "الإنشقاق", "আল-ইনশিকাক", 25, "meccan", 30],
  [85, "Al-Buruj", "البروج", "আল-বুরূজ", 22, "meccan", 30],
  [86, "At-Tariq", "الطارق", "আত-তারিক", 17, "meccan", 30],
  [87, "Al-Ala", "الأعلى", "আল-আলা", 19, "meccan", 30],
  [88, "Al-Ghashiyah", "الغاشية", "আল-গাশিয়া", 26, "meccan", 30],
  [89, "Al-Fajr", "الفجر", "আল-ফাজর", 30, "meccan", 30],
  [90, "Al-Balad", "البلد", "আল-বালাদ", 20, "meccan", 30],
  [91, "Ash-Shams", "الشمس", "আশ-শামস", 15, "meccan", 30],
  [92, "Al-Layl", "الليل", "আল-লাইল", 21, "meccan", 30],
  [93, "Ad-Duha", "الضحى", "আদ-দুহা", 11, "meccan", 30],
  [94, "Ash-Sharh", "الشرح", "আশ-শারহ", 8, "meccan", 30],
  [95, "At-Tin", "التين", "আত-তীন", 8, "meccan", 30],
  [96, "Al-Alaq", "العلق", "আল-আলাক", 19, "meccan", 30],
  [97, "Al-Qadr", "القدر", "আল-কদর", 5, "meccan", 30],
  [98, "Al-Bayyinah", "البينة", "আল-বাইয়িনা", 8, "medinan", 30],
  [99, "Az-Zalzalah", "الزلزلة", "আয-যালযালা", 8, "medinan", 30],
  [100, "Al-Adiyat", "العاديات", "আল-আদিয়াত", 11, "meccan", 30],
  [101, "Al-Qariah", "القارعة", "আল-কারিয়া", 11, "meccan", 30],
  [102, "At-Takathur", "التكاثر", "আত-তাকাসুর", 8, "meccan", 30],
  [103, "Al-Asr", "العصر", "আল-আসর", 3, "meccan", 30],
  [104, "Al-Humazah", "الهمزة", "আল-হুমাযা", 9, "meccan", 30],
  [105, "Al-Fil", "الفيل", "আল-ফীল", 5, "meccan", 30],
  [106, "Quraysh", "قريش", "কুরাইশ", 4, "meccan", 30],
  [107, "Al-Maun", "الماعون", "আল-মাউন", 7, "meccan", 30],
  [108, "Al-Kawthar", "الكوثر", "আল-কাওসার", 3, "meccan", 30],
  [109, "Al-Kafirun", "الكافرون", "আল-কাফিরূন", 6, "meccan", 30],
  [110, "An-Nasr", "النصر", "আন-নাসর", 3, "medinan", 30],
  [111, "Al-Masad", "المسد", "আল-মাসাদ", 5, "meccan", 30],
  [112, "Al-Ikhlas", "الإخلاص", "আল-ইখলাস", 4, "meccan", 30],
  [113, "Al-Falaq", "الفلق", "আল-ফালাক", 5, "meccan", 30],
  [114, "An-Nas", "الناس", "আন-নাস", 6, "meccan", 30],
];

// Merge detailed + compact into one SURAHS array
export const SURAHS: Surah[] = [
  ...DETAIL,
  ...COMPACT.map(([number, name, nameArabic, nameBengali, numberOfAyahs, revelationType, from, to]) => ({
    number, name, nameArabic, nameBengali, numberOfAyahs, revelationType,
    paraNumbers: paras(from, to),
  })),
];

// Quick lookup by surah number
export const SURAH_BY_NUMBER = new Map<number, Surah>(SURAHS.map((s) => [s.number, s]));

// Total ayahs across all 114 surahs (standard Hafs count)
export const TOTAL_QURAN_AYAHS = SURAHS.reduce((sum, s) => sum + s.numberOfAyahs, 0);

// --- Name-based lookup for matching free-text surahName from HifzRecord ---
// Normalizes names by lowercasing, stripping "al-", removing non-alphanumeric.
function normalizeName(s: string): string {
  return s
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "") // Arabic diacritics
    .replace(/^al|-|'/g, "")
    .replace(/[^\p{L}\p{N}]/gu, "");
}

// Build lookup map: normalized name → surah number (covers English, Arabic, Bengali forms)
const NAME_LOOKUP = new Map<string, number>();
for (const s of SURAHS) {
  for (const candidate of [s.name, s.nameArabic, s.nameBengali, String(s.number)]) {
    const n = normalizeName(candidate);
    if (n) NAME_LOOKUP.set(n, s.number);
  }
  // Extra aliases for common transliterations
  if (s.number === 36) NAME_LOOKUP.set("yasin", 36);
  if (s.number === 55) NAME_LOOKUP.set("rahman", 55);
  if (s.number === 112) NAME_LOOKUP.set("ikhlas", 112);
}

/** Try to match a free-text surah name (English, Arabic, Bengali, or number-string) to a surah number. Returns 0 if no match. */
export function matchSurahName(input: string | null | undefined): number {
  if (!input) return 0;
  const n = normalizeName(input);
  if (!n) return 0;
  if (NAME_LOOKUP.has(n)) return NAME_LOOKUP.get(n)!;
  // Try numeric parsing (e.g., "Surah 2" or just "2")
  const num = parseInt(input.trim(), 10);
  if (!isNaN(num) && num >= 1 && num <= 114) return num;
  // Try prefix match on English name
  for (const s of SURAHS) {
    if (normalizeName(s.name).startsWith(n.slice(0, 4)) && n.length >= 4) return s.number;
  }
  return 0;
}
