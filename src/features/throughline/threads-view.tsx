import { useEffect, useMemo, useState } from "react";
import { CodeBlock, isEntrySignal, renderContent } from "@/features/throughline/shared";
import type { ThroughlineEntry, ThroughlineThreadsView } from "@/lib/types";

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

function isSilentThread(row: ThroughlineThreadsView["rows"][number]): boolean {
  if (row.captures === 0) return false;
  if (row.signals > 0) return false;
  if (!row.last_at) return false;
  return Date.now() - new Date(row.last_at).getTime() > FOURTEEN_DAYS_MS;
}

function daysSince(iso?: string): number {
  if (!iso) return 0;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60 * 24));
}

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

function threadKey(kind: "goal" | "project", id: string) {
  return `${kind}:${id}`;
}

function resolveThreadEntries(row: ThroughlineThreadsView["rows"][number], entries: ThroughlineEntry[]) {
  const list =
    row.kind === "goal"
      ? entries.filter((entry) => (entry.goals ?? []).includes(row.id))
      : entries.filter((entry) => (entry.projects ?? []).includes(row.id));
  return [...list].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export interface ThreadsViewProps {
  data: ThroughlineThreadsView | null;
  isLoading: boolean;
  entries: ThroughlineEntry[];
  akhirahLens?: boolean;
}

/** Renders the threads surface with selectable timeline points and detail panels. */
export function ThreadsView({ data, isLoading, entries, akhirahLens }: ThreadsViewProps) {
  const [activeThread, setActiveThread] = useState<string | null>(null);
  const [activePoint, setActivePoint] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.rows.length) {
      setActiveThread(null);
      setActivePoint(null);
      return;
    }
    const firstKey = threadKey(data.rows[0].kind, data.rows[0].id);
    setActiveThread((prev) => (prev ? prev : firstKey));
  }, [data]);

  const activeRow = useMemo(() => {
    if (!data?.rows.length) return null;
    return data.rows.find((row) => threadKey(row.kind, row.id) === activeThread) ?? data.rows[0];
  }, [data, activeThread]);

  const activeEntries = useMemo(
    () => (activeRow ? resolveThreadEntries(activeRow, entries) : []),
    [activeRow, entries],
  );

  const activeSignals = useMemo(
    () => activeEntries.filter((entry) => isEntrySignal(entry) || entry.isPivot).slice(0, 8),
    [activeEntries],
  );

  const activeCapture = useMemo(
    () => activeEntries.find((entry) => entry.id === activePoint) ?? null,
    [activeEntries, activePoint],
  );

  const activeThreadKey = activeRow ? threadKey(activeRow.kind, activeRow.id) : null;

  const { healingThreadKeys, akhirahThreadKeys } = useMemo(() => {
    if (!data?.rows.length) return { healingThreadKeys: new Set<string>(), akhirahThreadKeys: new Set<string>() };

    // Single O(entries) pass to build both goal and project entry maps.
    const goalMap = new Map<string, ThroughlineEntry[]>();
    const projectMap = new Map<string, ThroughlineEntry[]>();
    const akhirah = new Set<string>();

    for (const entry of entries) {
      for (const gId of (entry.goals ?? [])) {
        const list = goalMap.get(gId);
        if (list) list.push(entry); else goalMap.set(gId, [entry]);
        if (entry.priority === "akhirah") akhirah.add(`goal:${gId}`);
      }
      for (const pId of (entry.projects ?? [])) {
        const list = projectMap.get(pId);
        if (list) list.push(entry); else projectMap.set(pId, [entry]);
        if (entry.priority === "akhirah") akhirah.add(`project:${pId}`);
      }
    }

    const healing = new Set<string>();
    for (const row of data.rows) {
      if (!isSilentThread(row)) continue;
      const rowEntries = (row.kind === "goal" ? goalMap.get(row.id) : projectMap.get(row.id)) ?? [];
      const recent = rowEntries.slice(0, 10);
      if (recent.length === 0) continue;
      const contractedCount = recent.filter((e) => e.stateOfHeart === "contracted").length;
      if (contractedCount / recent.length > 0.5) healing.add(threadKey(row.kind, row.id));
    }

    return { healingThreadKeys: healing, akhirahThreadKeys: akhirah };
  }, [data, entries]);

  useEffect(() => {
    setActivePoint((current) => (current && activeEntries.some((entry) => entry.id === current) ? current : null));
  }, [activeEntries]);

  if (isLoading) {
    return (
      <main className="main main-wide">
        <div className="view-shell view-shell-wide">
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
      <main className="main main-wide">
        <div className="view-shell view-shell-wide">
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
  if (!activeRow) {
    return null;
  }

  return (
    <main className="main main-wide">
      <div className="view-shell view-shell-wide">
        <div className="view-head">
          <h1>
            Your life as <em>lines</em>.
          </h1>
          <p className="deck-copy">
            Window: {formatDate(data.from)} - {formatDate(data.to)} · {data.rows.length} threads
          </p>
        </div>

        <div className="thread-list" role="list" aria-label="Thread list">
          {data.rows.map((row) => {
            const key = threadKey(row.kind, row.id);
            const silent = isSilentThread(row);
            const healing = silent && healingThreadKeys.has(key);
            const dimmed = akhirahLens && !akhirahThreadKeys.has(key);
            return (
            <div
              key={`${row.kind}-${row.id}`}
              className={`thread-row ${row.kind} ${key === activeThread ? "active" : ""} ${dimmed ? "akhirah-dim" : ""}`}
              role="listitem"
            >
              <div className="meta">
                <div className="kind">
                  {row.kind === "goal" ? "Life goal" : "Project"}
                  {healing && <span className="thread-healing-badge" title="Many contracted entries — prioritize spiritual ease">Healing</span>}
                  {silent && !healing && <span className="thread-quiet-badge" title="No signals in 14+ days — Ṣabr or stagnation?">Quiet</span>}
                </div>
                <button
                  className="name-btn"
                  onClick={() => setActiveThread(key)}
                  type="button"
                  aria-pressed={key === activeThread}
                  aria-label={`Open thread ${row.name}`}
                >
                  {row.name}
                </button>
                <div className="stats">
                  {row.captures} captures · {row.signals} signals · {row.pivots} pivots
                </div>
              </div>
              <div className="line">
                <div className="track" />
                <span className="now-mark" style={{ left: "100%" }} />
                {row.points.map((point) => (
                  <button
                    key={point.id}
                    className={`dot ${point.kind}`}
                    style={{ left: `${point.position}%` }}
                    title={`${point.kind} · ${formatDate(point.created_at)}`}
                    onClick={() => {
                      setActiveThread(threadKey(row.kind, row.id));
                      setActivePoint(point.id);
                    }}
                    type="button"
                    data-testid={`thread-point-${point.id}`}
                    aria-label={`Open ${point.kind} from ${formatDate(point.created_at)} in ${row.name}`}
                    aria-pressed={activePoint === point.id && activeThreadKey === threadKey(row.kind, row.id)}
                  />
                ))}
              </div>
              {row.latest_signal ? (
                <div className="preview">
                  <span className="when">{formatDate(row.latest_signal.created_at)}</span>
                  <span className="preview-content">{renderContent(row.latest_signal.content)}</span>
                </div>
              ) : null}
            </div>
            );
          })}
        </div>

        <div className="thread-detail-panel" aria-live="polite">
          <div className="head">
            <div className="meta">{activeRow.kind === "goal" ? "Life goal" : "Project"}</div>
            <h3>{activeRow.name}</h3>
            <div className="stats">
              <span>{activeRow.captures} captures</span>
              <span>{activeRow.signals} signals</span>
              <span>{activeRow.pivots} pivots</span>
              <span>Started {formatDate(activeRow.started_at)}</span>
              <span>Last {formatDate(activeRow.last_at)}</span>
            </div>
          </div>

          {isSilentThread(activeRow) && healingThreadKeys.has(threadKey(activeRow.kind, activeRow.id)) ? (
            <div className="sabr-prompt healing">
              <div className="sabr-prompt-label">Prioritize <em>Inshirāḥ</em></div>
              <p>
                More than half of recent entries in this thread were captured in a state of Qabd (contraction). Before pushing for more productivity here, tend to your spiritual ease — <em>Inshirāḥ</em>. Rest, dhikr, or service may open this thread more than effort alone.
              </p>
            </div>
          ) : isSilentThread(activeRow) ? (
            <div className="sabr-prompt">
              <div className="sabr-prompt-label">Ṣabr or stagnation?</div>
              <p>
                This thread has been quiet for {daysSince(activeRow.last_at)} days with no signals marked. Is this patient
                persistence — <em>Ṣabr</em> — or have you drifted from this throughline? Reflect on what is keeping it
                silent before your next weekly review.
              </p>
            </div>
          ) : null}

          {activeCapture ? (
            <div className="capture-detail">
              <div className="detail-label">Selected capture</div>
              <div className="detail-meta">{formatDayTime(activeCapture.created_at)}</div>
              <div className="detail-content" data-testid="thread-capture-detail">
                {activeCapture.isCode ? <CodeBlock content={activeCapture.content} /> : renderContent(activeCapture.content)}
              </div>
            </div>
          ) : (
            <div className="capture-detail muted">Click a bead to inspect a specific capture.</div>
          )}

          <div className="signals-block">
            <div className="detail-label">Signals in this thread ({activeSignals.length})</div>
            {activeSignals.length === 0 ? (
              <div className="capture-detail muted">No signals marked in this thread yet.</div>
            ) : (
              <div className="signal-list">
                {activeSignals.map((entry) => (
                  <button
                    key={entry.id}
                    className={`signal-row ${entry.id === activePoint ? "active" : ""}`}
                    onClick={() => setActivePoint(entry.id)}
                    type="button"
                    aria-pressed={entry.id === activePoint}
                    aria-label={`Open signal from ${formatDayTime(entry.created_at)}`}
                  >
                    <span className="when">{formatDayTime(entry.created_at)}</span>
                    <div className={`txt ${entry.isPivot ? "pivot" : ""}`}>
                      {entry.isCode && entry.content ? (
                        <CodeBlock content={entry.content} />
                      ) : entry.content ? (
                        renderContent(entry.content)
                      ) : (
                        entry.pivotLabel || entry.to || "Pivot"
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
