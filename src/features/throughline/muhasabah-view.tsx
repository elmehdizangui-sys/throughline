"use client";

import { useEffect, useState } from "react";
import { getEntryPlainText } from "@/features/throughline/shared";
import type { MuhasabahReport, MuhasabahThread } from "@/lib/types";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString([], { month: "short", day: "numeric" });
}

function formatMonth(value: string) {
  return new Date(value).toLocaleDateString([], { month: "long", year: "numeric" });
}

function AkhirahBar({ fraction }: { fraction: number }) {
  const pct = Math.round(fraction * 100);
  return (
    <div className="muhasabah-bar-wrap" aria-label={`${pct}% Akhirah`}>
      <div className="muhasabah-bar">
        <div className="muhasabah-bar-fill" style={{ width: `${pct}%` }} />
      </div>
      <span className="muhasabah-bar-label">{pct}% Akhirah</span>
    </div>
  );
}

const HEART_STATE_LABELS: Record<HeartState, string> = {
  open: "○ Inshirāḥ",
  clear: "◇ Ṣafā",
  clouded: "≈ Ghaflah",
  contracted: "● Qabd",
};

function HeartStateSummary({ counts }: { counts: Record<HeartState, number> }) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="muhasabah-heart-summary">
      <div className="muhasabah-heart-label">Ḥāl (Heart State) distribution</div>
      <div className="muhasabah-heart-grid">
        {(Object.entries(counts) as [HeartState, number][]).map(([state, count]) => {
          const pct = Math.round((count / total) * 100);
          return (
            <div key={state} className={`muhasabah-heart-stat ${state}`}>
              <div className="muhasabah-heart-icon">{HEART_STATE_LABELS[state]}</div>
              <div className="muhasabah-heart-bar-bg">
                <div className="muhasabah-heart-bar-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="muhasabah-heart-pct">{pct}%</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NiyyahDriftPrompt({ thread }: { thread: MuhasabahThread }) {
  if (thread.kind !== "goal") return null;
  if (thread.primary_intent !== "legacy") return null;
  const total = thread.akhirahCount + thread.dunyaCount;
  if (total === 0 || thread.dunyaCount <= thread.akhirahCount) return null;
  return (
    <div className="muhasabah-drift-prompt">
      <div className="muhasabah-drift-label">Niyyah Drift</div>
      <p>
        You intended this goal for Akhirah, but your captured entries lean toward Dunya ({thread.dunyaCount} Dunya vs {thread.akhirahCount} Akhirah). How can you re-tether this work to your legacy intention?
      </p>
    </div>
  );
}

function ThreadBlock({ thread }: { thread: MuhasabahThread }) {
  const total = thread.signals.length + thread.pivots.length;
  if (total === 0) return null;
  return (
    <div className="muhasabah-thread">
      <div className="muhasabah-thread-head">
        <span className="muhasabah-thread-dot" style={{ background: thread.color ?? "var(--ink-3)" }} />
        <span className="muhasabah-thread-kind">{thread.kind === "goal" ? "Life goal" : "Project"}</span>
        <span className="muhasabah-thread-name">{thread.name}</span>
        {thread.primary_intent === "legacy" && <span className="muhasabah-intent-moon" aria-label="Akhirah goal">☽</span>}
        <span className="muhasabah-thread-counts">
          {thread.signals.length} signals · {thread.pivots.length} pivots
          {thread.akhirahCount > 0 && <span className="muhasabah-akhirah-tag">{thread.akhirahCount} Akhirah</span>}
        </span>
      </div>
      <NiyyahDriftPrompt thread={thread} />
      <div className="muhasabah-signal-list">
        {[...thread.pivots, ...thread.signals].map((item) => (
          <div key={item.id} className={`muhasabah-signal-item ${item.isPivot ? "pivot" : ""} ${item.priority === "akhirah" ? "akhirah" : ""}`}>
            <span className="when">{formatDate(item.created_at)}</span>
            <span className="txt">{item.isPivot ? (item.pivotLabel || "Pivot") : getEntryPlainText(item.content)}</span>
            {item.priority && <span className={`priority-tag ${item.priority}`}>{item.priority}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export function MuhasabahView() {
  const [report, setReport] = useState<MuhasabahReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [months, setMonths] = useState(1);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/muhasabah?months=${months}`, { cache: "no-store" });
        if (!response.ok) {
          if (!cancelled) setError("Could not load your Muhāsabah report. Please try again.");
          return;
        }
        const data = (await response.json()) as MuhasabahReport;
        if (!cancelled) setReport(data);
      } catch {
        if (!cancelled) setError("Something went wrong loading the report.");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    void load();
    return () => { cancelled = true; };
  }, [months]);

  if (isLoading) {
    return (
      <main className="main">
        <div className="view-shell">
          <div className="view-head">
            <h1>Muhāsabah is <em>loading</em>.</h1>
          </div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="main">
        <div className="view-shell">
          <div className="view-head">
            <h1>Monthly <em>Muhāsabah</em>.</h1>
            <p className="deck-copy muhasabah-error">{error}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="main">
      <div className="view-shell">
        <div className="view-head">
          <h1>Monthly <em>Muhāsabah</em>.</h1>
          <p className="deck-copy">
            Self-auditing your signals and pivots — what are you leaving behind?
            {report && <> · {formatMonth(report.from)} → {formatMonth(report.to)}</>}
          </p>
          <div className="muhasabah-period">
            {([1, 2, 3] as const).map((m) => (
              <button
                key={m}
                className={months === m ? "on" : ""}
                onClick={() => setMonths(m)}
                type="button"
              >
                {m === 1 ? "Last month" : `Last ${m} months`}
              </button>
            ))}
          </div>
        </div>

        {report && (
          <>
            <div className="muhasabah-summary">
              <div className="muhasabah-stat">
                <div className="muhasabah-stat-n">{report.totalSignals}</div>
                <div className="muhasabah-stat-l">Signals promoted</div>
              </div>
              <div className="muhasabah-stat">
                <div className="muhasabah-stat-n">{report.totalPivots}</div>
                <div className="muhasabah-stat-l">Pivots marked</div>
              </div>
              <div className="muhasabah-stat wide">
                <AkhirahBar fraction={report.akhirahFraction} />
                <div className="muhasabah-stat-l">of your signals are for the Akhirah</div>
              </div>
            </div>

            <HeartStateSummary counts={report.heartStateCounts} />

            {report.threads.length === 0 ? (
              <div className="capture-detail muted">
                No promoted signals or pivots in this window yet. Star entries or mark pivots in the Feed to surface them here.
              </div>
            ) : (
              <div className="muhasabah-threads">
                {report.threads.map((thread) => (
                  <ThreadBlock key={`${thread.kind}-${thread.id}`} thread={thread} />
                ))}
              </div>
            )}

            {report.totalSignals > 0 && (
              <div className="muhasabah-reflection">
                <div className="muhasabah-reflection-label">Reflection prompt</div>
                <p>
                  Of your {report.totalSignals} signals this period,{" "}
                  {report.akhirahFraction > 0.5
                    ? "the majority were oriented toward Akhirah — your legacy work is leading. Ensure the Dunya threads are not neglected."
                    : report.akhirahFraction > 0
                    ? "a portion were for Akhirah. Consider which threads deserve more intentional Niyyah toward legacy."
                    : "none were tagged as Akhirah. Is the work you are capturing aligned with what you want to leave behind?"}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}
