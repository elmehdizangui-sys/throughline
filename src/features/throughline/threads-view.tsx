import type { ThroughlineThreadsView } from "@/lib/types";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

export function ThreadsView({
  data,
  isLoading,
}: {
  data: ThroughlineThreadsView | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <main className="main">
        <div className="view-shell">
          <div className="view-head">
            <h1>
              Threads are <em>loading</em>.
            </h1>
          </div>
        </div>
      </main>
    );
  }

  if (!data || data.rows.length === 0) {
    return (
      <main className="main">
        <div className="view-shell">
          <div className="view-head">
            <h1>
              No threads <em>yet</em>.
            </h1>
            <p className="deck-copy">Create goals, projects, and captures in Feed first. Threads render once there is activity over time.</p>
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
            Your life as <em>lines</em>.
          </h1>
          <p className="deck-copy">
            Window: {formatDate(data.from)} - {formatDate(data.to)} · {data.rows.length} threads
          </p>
        </div>

        <div className="thread-list">
          {data.rows.map((row) => (
            <div key={`${row.kind}-${row.id}`} className={`thread-row ${row.kind}`}>
              <div className="meta">
                <div className="kind">{row.kind === "goal" ? "Life goal" : "Project"}</div>
                <div className="name">{row.name}</div>
                <div className="stats">
                  {row.captures} captures · {row.signals} signals · {row.pivots} pivots
                </div>
              </div>
              <div className="line">
                <div className="track" />
                {row.points.map((point) => (
                  <span
                    key={point.id}
                    className={`dot ${point.kind}`}
                    style={{ left: `${point.position}%` }}
                    title={`${point.kind} · ${formatDate(point.created_at)}`}
                  />
                ))}
              </div>
              {row.latest_signal ? (
                <div className="preview">
                  <span className="when">{formatDate(row.latest_signal.created_at)}</span>
                  <span>{row.latest_signal.content}</span>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
