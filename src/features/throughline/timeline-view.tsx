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

export function TimelineView({
  data,
  isLoading,
  entries,
  onYearChange,
}: {
  data: ThroughlineTimelineYear | null;
  isLoading: boolean;
  entries: ThroughlineEntry[];
  onYearChange: (nextYear: number) => void;
}) {
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

  if (isLoading) {
    return (
      <main className="main">
        <div className="view-shell">
          <div className="view-head">
            <h1>
              Timeline is <em>loading</em>.
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="main">
        <div className="view-shell">
          <div className="view-head">
            <h1>
              Year line is <em>empty</em>.
            </h1>
          </div>
        </div>
      </main>
    );
  }

  const selected = data.weeks.find((week) => week.week === selectedWeek) ?? data.weeks[0];
  const selectedEntries = useMemo(
    () =>
      entries
        .filter((entry) => {
          const at = new Date(entry.created_at).getTime();
          return at >= new Date(selected.start).getTime() && at <= new Date(selected.end).getTime();
        })
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [entries, selected.end, selected.start],
  );
  const selectedSignals = useMemo(
    () => selectedEntries.filter((entry) => isEntrySignal(entry) || entry.isPivot).slice(0, 10),
    [selectedEntries],
  );

  return (
    <main className="main">
      <div className="view-shell">
        <div className="view-head">
          <h1>
            The year in <em>one line</em>.
          </h1>
          <p className="deck-copy">
            {data.year} · Week {data.nowWeek || 0} · {data.pivots.length} pivots
          </p>
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
              type="button"
              data-testid={`timeline-week-${week.week}`}
            >
              <span className="base" style={{ height: `${Math.max(2, week.captures * 2)}px` }} />
              {week.signals > 0 ? <span className="sig" style={{ height: `${Math.max(2, week.signals * 2)}px` }} /> : null}
            </button>
          ))}
        </div>

        <div className="ribbon-list">
          {data.ribbons.map((ribbon) => (
            <div key={`${ribbon.kind}-${ribbon.id}`} className={`ribbon ${ribbon.kind}`}>
              <span className="label">{ribbon.label}</span>
              <span className="range">
                {formatDate(ribbon.start)} - {formatDate(ribbon.end)}
              </span>
            </div>
          ))}
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
                  <span className={`txt ${entry.isPivot ? "pivot" : ""}`}>
                    {entry.isCode ? <CodeBlock content={entry.content} /> : renderContent(entry.content || entry.pivotLabel || entry.to || "Pivot")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
