import { useEffect, useMemo, useState } from "react";
import { CodeBlock, isEntrySignal, renderContent } from "@/features/throughline/shared";
import type { ThroughlineEntry, ThroughlineTimelineYear } from "@/lib/types";

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

/** Renders the yearly timeline surface with week, ribbon, and pivot details. */
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

  if (isLoading) {
    return (
      <main className="main main-wide">
        <div className="view-shell view-shell-wide">
          <div className="view-head">
            <h1>
              Timeline is <em>loading</em>.
            </h1>
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
            <h1>
              Year line is <em>empty</em>.
            </h1>
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
        <div className="view-head">
          <h1>
            The year in <em>one line</em>.
          </h1>
          <p className="deck-copy">
            {data.year} · Week {data.nowWeek || 0} · {data.pivots.length} pivots
          </p>
          {onToggleAkhirahLens && (
            <button
              className={`akhirah-lens-btn ${akhirahLens ? "on" : ""}`}
              onClick={onToggleAkhirahLens}
              type="button"
              aria-pressed={akhirahLens ?? false}
              title={akhirahLens ? "Akhirah lens on — click to disable" : "Enable Akhirah lens to dim Dunya threads"}
            >
              <svg width="13" height="13" viewBox="0 0 16 16" fill="none" aria-hidden="true" style={{ marginRight: 4 }}>
                <path d="M13 10.5a6 6 0 01-7.5-7.5A6 6 0 1013 10.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Akhirah lens {akhirahLens ? "on" : "off"}
            </button>
          )}
          <div className="year-nav">
            <button onClick={() => onYearChange(data.year - 1)} type="button">
              ‹ {data.year - 1}
            </button>
            <span>{data.year}</span>
            <button onClick={() => onYearChange(data.year + 1)} type="button">
              {data.year + 1} ›
            </button>
          </div>
        </div>

        <div className="year-bars-lite">
          {data.weeks.map((week) => (
            <button
              key={week.week}
              className={`bar ${data.nowWeek === week.week ? "now" : ""} ${selected.week === week.week ? "active" : ""}`}
              title={`W${week.week}: ${week.captures} captures`}
              onClick={() => setSelectedWeek(week.week)}
              onKeyDown={(event) => {
                if (event.key === "ArrowRight") {
                  event.preventDefault();
                  moveWeekSelection(1);
                } else if (event.key === "ArrowLeft") {
                  event.preventDefault();
                  moveWeekSelection(-1);
                } else if (event.key === "Home") {
                  event.preventDefault();
                  setSelectedWeek(data.weeks[0].week);
                } else if (event.key === "End") {
                  event.preventDefault();
                  setSelectedWeek(data.weeks[data.weeks.length - 1].week);
                }
              }}
              type="button"
              data-testid={`timeline-week-${week.week}`}
              aria-label={`Select week ${week.week}`}
              aria-pressed={selected.week === week.week}
            >
              <span className="base" style={{ height: `${Math.max(2, week.captures * 2)}px` }} />
              {week.signals > 0 ? <span className="sig" style={{ height: `${Math.max(2, week.signals * 2)}px` }} /> : null}
            </button>
          ))}
        </div>

        <div className="ribbon-list">
          {data.ribbons.map((ribbon) => {
            const dimmed = akhirahLens && !akhirahRibbonIds.has(ribbon.id);
            return (
            <div
              key={`${ribbon.kind}-${ribbon.id}`}
              className={`ribbon ${ribbon.kind} ${dimmed ? "akhirah-dim-ribbon" : ""}`}
            >
              <span className="label">{ribbon.label}</span>
              <span className="range">
                {formatDate(ribbon.start)} - {formatDate(ribbon.end)}
              </span>
            </div>
            );
          })}
        </div>

        <div className="pivot-list">
          {data.pivots.map((pivot) => (
            <div key={pivot.id} className="pivot-item">
              <span className="when">{formatDate(pivot.created_at)}</span>
              <span className="txt">{pivot.label}</span>
            </div>
          ))}
          {data.pivots.length === 0 ? <div className="empty-inline">No pivots marked for this year yet.</div> : null}
        </div>

        <div className="week-detail">
          <div className="head">
            <div className="meta" data-testid="timeline-week-meta">
              Week {selected.week} · {formatDate(selected.start)} - {formatDate(selected.end)}
            </div>
            <h3>
              {selected.captures} captures, <em>{selected.signals} signals</em>, {selected.pivots} pivots
            </h3>
          </div>
          {selectedSignals.length === 0 ? (
            <div className="capture-detail muted">No signal entries for this week.</div>
          ) : (
            <div className="signal-list timeline-signals">
              {selectedSignals.map((entry) => (
                <div key={entry.id} className="signal-row static">
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
    </main>
  );
}
