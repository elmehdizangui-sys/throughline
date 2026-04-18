import type { ThroughlineTimelineYear } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function TimelineView({
  data,
  isLoading,
}: {
  data: ThroughlineTimelineYear | null;
  isLoading: boolean;
}) {
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
        </div>

        <div className="year-bars-lite">
          {data.weeks.map((week) => (
            <div key={week.week} className={`bar ${data.nowWeek === week.week ? "now" : ""}`} title={`W${week.week}: ${week.captures} captures`}>
              <span className="base" style={{ height: `${Math.max(2, week.captures * 2)}px` }} />
              {week.signals > 0 ? <span className="sig" style={{ height: `${Math.max(2, week.signals * 2)}px` }} /> : null}
            </div>
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
      </div>
    </main>
  );
}
