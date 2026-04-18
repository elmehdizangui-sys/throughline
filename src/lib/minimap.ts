import type { MinimapWeek, ThroughlineEntry } from "@/lib/types";

function isoWeekLabel(date: Date) {
  const target = new Date(date.valueOf());
  const dayNumber = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNumber + 3);
  const firstThursday = new Date(target.getFullYear(), 0, 4);
  const firstDayNumber = (firstThursday.getDay() + 6) % 7;
  firstThursday.setDate(firstThursday.getDate() - firstDayNumber + 3);
  const weekNo = 1 + Math.round((target.getTime() - firstThursday.getTime()) / 604800000);
  return `W${String(weekNo).padStart(2, "0")}`;
}

function activityLevel(count: number): MinimapWeek["level"] {
  if (count >= 7) return 3;
  if (count >= 4) return 2;
  if (count >= 1) return 1;
  return 0;
}

export function buildMinimap(entries: ThroughlineEntry[], weeks = 8): MinimapWeek[] {
  const weekMap = new Map<
    string,
    {
      captures: number;
      pivot: boolean;
    }
  >();

  for (const entry of entries) {
    const key = isoWeekLabel(new Date(entry.created_at));
    const prev = weekMap.get(key) ?? { captures: 0, pivot: false };
    weekMap.set(key, {
      captures: entry.isPivot ? prev.captures : prev.captures + 1,
      pivot: prev.pivot || Boolean(entry.isPivot),
    });
  }

  const result: MinimapWeek[] = [];
  const now = new Date();
  for (let i = 0; i < weeks; i += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() - i * 7);
    const key = isoWeekLabel(date);
    const val = weekMap.get(key) ?? { captures: 0, pivot: false };
    result.push({
      week: key,
      level: activityLevel(val.captures),
      pivot: val.pivot || undefined,
    });
  }
  return result;
}
