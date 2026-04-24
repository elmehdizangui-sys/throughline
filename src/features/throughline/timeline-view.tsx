import { useEffect, useMemo, useState } from "react";
import { CodeBlock, isEntrySignal, renderContent } from "@/features/throughline/shared";
import type { ThroughlineEntry, ThroughlineTimelineYear } from "@/lib/types";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
// Day-of-year start for each month (1-indexed) as a fraction of 365
const MONTH_PCTS = [0, 8.77, 16.44, 24.93, 33.15, 41.64, 49.86, 58.36, 66.85, 75.07, 83.56, 91.78];

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatDayTime(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export interface TimelineViewProps {
  data: ThroughlineTimelineYear | null;
  isLoading: boolean;
  entries: ThroughlineEntry[];
  onYearChange: (nextYear: number) => void;
  akhirahLens?: boolean;
  onToggleAkhirahLens?: () => void;
}

export function TimelineView({ data, isLoading, entries, onYearChange, akhirahLens, onToggleAkhirahLens }: TimelineViewProps) {
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  useEffect(() => {
    if (!data) {
      setSelectedWeek(null);
      return;
    }
    if (data.nowWeek > 0) {
      setSelectedWeek(data.nowWeek);
      return;
    }
    const firstActive = data.weeks.find((week) => week.captures > 0 || week.signals > 0 || week.pivots > 0);
    setSelectedWeek(firstActive?.week ?? data.weeks[0]?.week ?? null);
  }, [data]);

  const selected = useMemo(() => {
    if (!data?.weeks.length) return null;
    return data.weeks.find((week) => week.week === selectedWeek) ?? data.weeks[0];
  }, [data, selectedWeek]);

  const selectedEntries = useMemo(() => {
    if (!selected) return [];
    return entries
      .filter((entry) => {
        const at = new Date(entry.created_at).getTime();
        return at >= new Date(selected.start).getTime() && at <= new Date(selected.end).getTime();
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [entries, selected]);

  const selectedSignals = useMemo(
    () => selectedEntries.filter((entry) => isEntrySignal(entry) || entry.isPivot).slice(0, 10),
    [selectedEntries],
  );

  const akhirahRibbonIds = useMemo(() => {
    if (!data?.ribbons.length) return new Set<string>();
    const set = new Set<string>();
    for (const ribbon of data.ribbons) {
      const has = entries.some((e) =>
        e.priority === "akhirah" &&
        (ribbon.kind === "goal" ? (e.goals ?? []).includes(ribbon.id) : (e.projects ?? []).includes(ribbon.id)),
      );
      if (has) set.add(ribbon.id);
    }
    return set;
  }, [data, entries]);

  const maxCaptures = useMemo(
    () => Math.max(...(data?.weeks.map((w) => w.captures) ?? []), 1),
    [data],
  );

  if (isLoading) {
    return (
      <main className="main main-wide">
        <div className="view-shell view-shell-wide">
          <div className="view-head">
            <h1>Timeline is <em>loading</em>.</h1>
          </div>
        </div>
      </main>
    );
  }

  if (!data || !selected) {
    return (
      <main className="main main-wide">
        <div className="view-shell view-shell-wide">
          <div className="view-head">
            <h1>Year line is <em>empty</em>.</h1>
          </div>
        </div>
      </main>
    );
  }

  const moveWeekSelection = (offset: number) => {
    const currentIndex = data.weeks.findIndex((week) => week.week === selected.week);
    if (currentIndex < 0) return;
    const nextIndex = Math.max(0, Math.min(data.weeks.length - 1, currentIndex + offset));
    setSelectedWeek(data.weeks[nextIndex].week);
  };

  return (
    <main className="main main-wide">
      <div className="view-shell view-shell-wide">
        <div className="tl">
          <div className="tl-head">
            <div>
              <h3>The year in <em>one line</em>.</h3>
              <div className="tl-sub">
                Density above · Pivots on the line · Ribbons for what was live
              </div>
              {onToggleAkhirahLens && (
                <button
                  className={`akhirah-lens-btn${akhirahLens ? " on" : ""}`}
                  onClick={onToggleAkhirahLens}
                  type="button"
                  aria-pressed={akhirahLens ?? false}
                  title={akhirahLens ? "Akhirah lens on — click to disable" : "Enable Akhirah lens to dim Dunya threads"}
                  style={{ marginTop: 10 }}
                >
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ marginRight: 4 }}>
                    <path d="M13 10.5a6 6 0 01-7.5-7.5A6 6 0 1013 10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Akhirah lens {akhirahLens ? "on" : "off"}
                </button>
              )}
            </div>
            <div className="range">
              <button
                className="nav"
                onClick={() => onYearChange(data.year - 1)}
                type="button"
                aria-label={`Go to ${data.year - 1}`}
              >
                ‹
              </button>
              <span>{data.year}</span>
              <button
                className="nav"
                onClick={() => onYearChange(data.year + 1)}
                type="button"
                aria-label={`Go to ${data.year + 1}`}
              >
                ›
              </button>
            </div>
          </div>

          {data.ribbons.length > 0 && (
            <div className="tl-ribbons" aria-label="Goals and projects active this year">
              {data.ribbons.map((ribbon) => {
                const dimmed = akhirahLens && !akhirahRibbonIds.has(ribbon.id);
                const startPos = ribbon.startPosition;
                const endPos = ribbon.endPosition;
                return (
                  <div
                    key={`${ribbon.kind}-${ribbon.id}`}
                    className={`tl-ribbon ${ribbon.kind} ${dimmed ? "akhirah-dim-ribbon" : ""}`}
                  >
                    <span className="label">
                      <span className="d" aria-hidden="true" />
                      {ribbon.label}
                    </span>
                    <span
                      className="band"
                      aria-hidden="true"
                      style={{
                        left: `calc(200px + (100% - 200px) * ${startPos})`,
                        right: `calc((100% - 200px) * ${1 - endPos})`,
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          <div className="year-line" aria-label={`${data.year} week activity`}>
            <span className="year-left-label" aria-hidden="true">Week activity</span>

            <div className="year-bars" role="group" aria-label="Select a week">
              {data.weeks.map((week) => {
                const baseH = week.captures > 0
                  ? Math.max(3, Math.round((week.captures / maxCaptures) * 64))
                  : 0;
                const sigH = week.signals > 0 && week.captures > 0
                  ? Math.max(2, Math.round((week.signals / week.captures) * baseH))
                  : 0;
                const isSelected = selected.week === week.week;
                const isNow = data.nowWeek === week.week;
                return (
                  <button
                    key={week.week}
                    className={`wk ${isNow || isSelected ? "on" : ""}`}
                    title={`W${week.week}: ${week.captures} captures`}
                    onClick={() => setSelectedWeek(week.week)}
                    onKeyDown={(event) => {
                      if (event.key === "ArrowRight") { event.preventDefault(); moveWeekSelection(1); }
                      else if (event.key === "ArrowLeft") { event.preventDefault(); moveWeekSelection(-1); }
                      else if (event.key === "Home") { event.preventDefault(); setSelectedWeek(data.weeks[0].week); }
                      else if (event.key === "End") { event.preventDefault(); setSelectedWeek(data.weeks[data.weeks.length - 1].week); }
                    }}
                    type="button"
                    data-testid={`timeline-week-${week.week}`}
                    aria-label={`Select week ${week.week}`}
                    aria-pressed={isSelected}
                  >
                    {baseH > 0 && <div className="blk" style={{ height: `${baseH}px` }} />}
                    {sigH > 0 && <div className="blk sig" style={{ height: `${sigH}px` }} />}
                  </button>
                );
              })}
            </div>

            {data.pivots.length > 0 && (
              <div className="year-pivots" aria-hidden="true">
                {data.pivots.map((pivot) => (
                  <div
                    key={pivot.id}
                    className="year-pivot"
                    style={{ left: `${pivot.position * 100}%` }}
                    title={pivot.label}
                  >
                    <span className="lbl">{pivot.label}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="year-axis" aria-hidden="true">
              {MONTHS.map((m, i) => (
                <span key={m} className="month" style={{ left: `${MONTH_PCTS[i]}%` }}>
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="tl-week-detail">
            <div className="wk-head">
              <div>
                <div className="wk-meta" data-testid="timeline-week-meta">
                  Week {selected.week} · {formatDate(selected.start)} — {formatDate(selected.end)}
                </div>
                <div className="wk-title">
                  {selected.captures} captures,{" "}
                  <em>{selected.signals} signal{selected.signals !== 1 ? "s" : ""}</em>
                  {selected.pivots > 0 ? `, ${selected.pivots} pivot${selected.pivots > 1 ? "s" : ""}` : ""}
                </div>
              </div>
              <div className="wk-stats">
                <span>{selected.captures} captures</span>
                {selected.signals > 0 && <span><strong>{selected.signals} signals</strong></span>}
                {selected.pivots > 0 && <span>{selected.pivots} pivots</span>}
              </div>
            </div>

            {selectedSignals.length === 0 ? (
              <div className="wk-signal-empty">No signals this week.</div>
            ) : (
              <div className="wk-signals">
                {selectedSignals.map((entry) => (
                  <div key={entry.id} className="wk-signal">
                    <span className="when">{formatDayTime(entry.created_at)}</span>
                    <div className={`txt ${entry.isPivot ? "pivot" : ""}`}>
                      {entry.isCode && entry.content ? (
                        <CodeBlock content={entry.content} />
                      ) : (
                        renderContent(entry.content || entry.pivotLabel || entry.to || "Pivot")
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
