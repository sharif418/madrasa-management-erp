"use client";
// StreakSection — personal streaks + badges + tenant-wide leaderboard
// Added to the Muhasaba Analytics tab.
import * as React from "react";
import { Flame, Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { useApp } from "@/store/app-store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

type PersonalStats = {
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
  monthlyAverage: number;
  badges: { id: string; labelKey: string; achieved: boolean; progress: number }[];
};

type LeaderboardEntry = {
  student: { id: string; name: string; rollNo: string | null };
  currentStreak: number;
  longestStreak: number;
  lastEntryDate: string | null;
  monthlyAverage: number;
  badges: { id: string; labelKey: string; achieved: boolean; progress: number }[];
};

type LeaderboardResp = {
  leaderboard: LeaderboardEntry[];
  summary: { avgCurrentStreak: number; avgLongestStreak: number; totalStudents: number };
  distribution: Record<string, number>;
};

const BADGE_TINTS: Record<string, string> = {
  week: "from-amber-400 to-orange-500",
  month: "from-rose-500 to-pink-600",
  perfectWeek: "from-emerald-500 to-teal-600",
};

const BADGE_ICONS: Record<string, React.ReactNode> = {
  week: <Flame className="size-4" />,
  month: <Trophy className="size-4" />,
  perfectWeek: <Award className="size-4" />,
};

const RANK_TINTS = [
  "from-amber-400 to-yellow-500", // gold
  "from-slate-300 to-slate-400", // silver
  "from-orange-400 to-amber-600", // bronze
];

export function StreakSection() {
  const { t, dir } = useApp();
  const [students, setStudents] = React.useState<{ id: string; name: string; rollNo: string | null }[]>([]);
  const [studentId, setStudentId] = React.useState<string>(""); // "" = leaderboard
  const [loading, setLoading] = React.useState(true);
  const [personal, setPersonal] = React.useState<PersonalStats | null>(null);
  const [leaderboard, setLeaderboard] = React.useState<LeaderboardResp | null>(null);

  // Load students
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/students?limit=200");
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        const items = (json.data.items ?? []).map((s: { id: string; name: string; rollNo: string | null }) => ({
          id: s.id, name: s.name, rollNo: s.rollNo,
        }));
        setStudents(items);
      } catch {
        // Silent
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Load streak data
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const qs = studentId ? `?studentId=${encodeURIComponent(studentId)}` : "";
        const res = await fetch(`/api/muhasaba/streaks${qs}`, { cache: "no-store" });
        const json = await res.json();
        if (cancelled) return;
        if (!json.ok) throw new Error(json.error);
        if (studentId) {
          setPersonal(json.data.personal as PersonalStats);
          setLeaderboard(null);
        } else {
          setLeaderboard(json.data as LeaderboardResp);
          setPersonal(null);
        }
      } catch (err) {
        toast.error(t("muhasaba.loadFailed"), { description: err instanceof Error ? err.message : "" });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [studentId, t]);

  return (
    <div className="space-y-4" dir={dir()}>
      <Card className="py-4">
        <CardContent className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="space-y-1.5 flex-1">
            <Label className="text-xs text-muted-foreground">{t("muhasaba.student")}</Label>
            <Select value={studentId} onValueChange={setStudentId}>
              <SelectTrigger className="w-full"><SelectValue placeholder={t("muhasaba.viewAllStudents")} /></SelectTrigger>
              <SelectContent className="max-h-72">
                {students.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}{s.rollNo ? ` · ${s.rollNo}` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="grid sm:grid-cols-3 gap-3">
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
        </div>
      ) : studentId && personal ? (
        <PersonalStreaksCard stats={personal} />
      ) : !studentId && leaderboard ? (
        <LeaderboardCard data={leaderboard} />
      ) : (
        <Card className="py-12">
          <CardContent className="text-center text-muted-foreground">
            <Flame className="mx-auto mb-3 size-10 opacity-40" />
            <p>{t("muhasaba.noStreaks")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function PersonalStreaksCard({ stats }: { stats: PersonalStats }) {
  const { t } = useApp();
  return (
    <>
      <div className="grid sm:grid-cols-3 gap-3">
        <KpiBig
          icon={<Flame className="size-5" />}
          label={t("muhasaba.currentStreak")}
          value={`${stats.currentStreak}`}
          suffix={t("muhasaba.days")}
          tint="from-orange-500 to-amber-500"
        />
        <KpiBig
          icon={<Trophy className="size-5" />}
          label={t("muhasaba.longestStreak")}
          value={`${stats.longestStreak}`}
          suffix={t("muhasaba.days")}
          tint="from-emerald-500 to-teal-600"
        />
        <KpiBig
          icon={<TrendingUp className="size-5" />}
          label={t("muhasaba.monthlyAverage")}
          value={stats.monthlyAverage.toFixed(1)}
          suffix={`/ ${t("muhasaba.days")}`}
          tint="from-rose-500 to-pink-600"
        />
      </div>

      <Card className="py-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Award className="size-4 text-amber-500" />
            {t("muhasaba.badges")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {stats.badges.map((b) => (
              <div
                key={b.id}
                className={cn(
                  "flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium transition-all",
                  b.achieved
                    ? `bg-gradient-to-r ${BADGE_TINTS[b.id] ?? "from-emerald-500 to-teal-600"} text-white shadow-md`
                    : "border border-dashed border-muted-foreground/40 text-muted-foreground opacity-70"
                )}
                title={`${Math.round(b.progress * 100)}%`}
              >
                {BADGE_ICONS[b.id] ?? <Award className="size-4" />}
                <span>{t(b.labelKey)}</span>
                {b.achieved ? (
                  <Badge className="bg-white/20 text-white ms-1">✓</Badge>
                ) : (
                  <span className="text-xs tabular-nums">{Math.round(b.progress * 100)}%</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function LeaderboardCard({ data }: { data: LeaderboardResp }) {
  const { t } = useApp();
  return (
    <Card className="py-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Medal className="size-4 text-amber-500" />
          {t("muhasaba.streakLeaderboard")}
        </CardTitle>
        <CardDescription>
          {t("muhasaba.avgConsistency")}: {data.summary.avgCurrentStreak} · {data.summary.totalStudents} {t("students.title").toLowerCase()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {data.leaderboard.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">{t("muhasaba.noStreaks")}</p>
        ) : (
          <div className="space-y-2">
            {data.leaderboard.map((entry, idx) => (
              <div
                key={entry.student.id}
                className="flex items-center justify-between rounded-lg border bg-muted/20 px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "grid size-8 place-items-center rounded-full text-white text-xs font-bold shadow-sm",
                    idx < 3 ? `bg-gradient-to-br ${RANK_TINTS[idx]}` : "bg-muted-foreground/60"
                  )}>
                    {idx < 3 ? (idx === 0 ? "🥇" : idx === 1 ? "🥈" : "🥉") : idx + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{entry.student.name}</p>
                    {entry.student.rollNo && <p className="text-xs text-muted-foreground">#{entry.student.rollNo}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-end">
                    <p className="flex items-center gap-1 text-sm font-bold text-orange-600 dark:text-orange-400">
                      <Flame className="size-3.5" /> {entry.currentStreak}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 justify-end">
                      <Trophy className="size-2.5" /> {entry.longestStreak} {t("muhasaba.days")}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1 max-w-[120px] justify-end">
                    {entry.badges.filter((b) => b.achieved).slice(0, 3).map((b) => (
                      <span key={b.id} className={cn("rounded-full size-5 grid place-items-center text-white bg-gradient-to-br", BADGE_TINTS[b.id])}>
                        {b.id === "week" ? "7" : b.id === "month" ? "30" : "✓"}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function KpiBig({ icon, label, value, suffix, tint }: {
  icon: React.ReactNode; label: string; value: string; suffix: string; tint: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-lg bg-gradient-to-br ${tint} text-white shadow-sm`}>
          {icon}
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">
            {value} <span className="text-xs text-muted-foreground font-normal">{suffix}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
