import { useCallback, useEffect, useMemo, useState } from "react";
import type { HeartState, ThroughlineEntry } from "@/lib/types";
import { CodeBlock, formatDay, formatTime, renderContent } from "@/features/throughline/shared";

const HEART_STATE_LABELS: Record<HeartState, string> = {
  open: "○ Inshirāḥ",
  clear: "◇ Ṣafā",
  clouded: "≈ Ghaflah",
  contracted: "● Qabd",
};

export function WeeklyReview({
  entries,
  onClose,
  onApply,
  onPatchHeart,
}: {
  entries: ThroughlineEntry[];
  onClose: () => void;
  onApply: (decisions: Record<string, "star" | "archive" | "promote" | "skip">) => void;
  onPatchHeart?: (id: string, state: HeartState) => void;
}) {
  const candidates = useMemo(
    () => entries.filter((entry) => !entry.isPivot && !entry.starred && !entry.archived).slice(0, 8),
    [entries],
  );
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, "star" | "archive" | "promote" | "skip">>({});
  const [heartStates, setHeartStates] = useState<Record<string, HeartState>>({});

  const done = index >= candidates.length;
  const current = candidates[index];

  const decide = useCallback(
    (action: "star" | "archive" | "promote" | "skip") => {
      const candidate = candidates[index];
      if (!candidate) return;
      setDecisions((state) => ({ ...state, [candidate.id]: action }));
      setIndex((value) => value + 1);
    },
    [candidates, index],
  );

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (done) return;
      if (event.key.toLowerCase() === "s") decide("star");
      if (event.key.toLowerCase() === "a") decide("archive");
      if (event.key.toLowerCase() === "p") decide("promote");
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        decide("skip");
      }
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [decide, done, onClose]);

  const starCount = Object.values(decisions).filter((value) => value === "star").length;
  const archiveCount = Object.values(decisions).filter((value) => value === "archive").length;
  const promoteCount = Object.values(decisions).filter((value) => value === "promote").length;

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-head">
          <div>
            <h2>
              What was the <em>signal</em> this week?
            </h2>
            <div className="sub">Quick passes. Star what matters, archive the noise, promote the breakthroughs.</div>
          </div>
          <button className="close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="progress-rail">
          <div className="bar" style={{ width: `${(((done ? candidates.length : index) || 0) / Math.max(candidates.length, 1)) * 100}%` }} />
        </div>
        <div className="modal-body">
          {!done && current ? (
            <>
              <div className="review-meta">
                <span>
                  Entry {index + 1} of {candidates.length}
                </span>
                <span>
                  ★ {starCount} - Archive {archiveCount} - Promote {promoteCount}
                </span>
              </div>
              <div className="review-entry">
                <div className="date">
                  {formatDay(current.created_at)} - {formatTime(current.created_at)}
                </div>
                <div className="content">{current.isCode ? <CodeBlock content={current.content} /> : renderContent(current.content)}</div>
                {onPatchHeart && (
                  <div className="review-heart-states">
                    <span className="review-heart-label">Hal (state of heart)</span>
                    <div className="review-heart-btns">
                      {(Object.entries(HEART_STATE_LABELS) as [HeartState, string][]).map(([state, label]) => (
                        <button
                          key={state}
                          className={`review-heart-btn ${heartStates[current.id] === state ? "on" : ""}`}
                          onClick={() => {
                            setHeartStates((prev) => ({ ...prev, [current.id]: state }));
                            onPatchHeart(current.id, state);
                          }}
                          type="button"
                          aria-pressed={heartStates[current.id] === state}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <div className="choices">
                  <button className="choice star" onClick={() => decide("star")} type="button">
                    <span className="label">★ Signal</span>
                    <span className="k">S</span>
                  </button>
                  <button className="choice archive" onClick={() => decide("archive")} type="button">
                    <span className="label">Archive</span>
                    <span className="k">A</span>
                  </button>
                  <button className="choice promote" onClick={() => decide("promote")} type="button">
                    <span className="label">Promote ↑</span>
                    <span className="k">P</span>
                  </button>
                  <button className="choice skip" onClick={() => decide("skip")} type="button">
                    <span className="label">Skip</span>
                    <span className="k">␣</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="review-done">
              <h3>That's your week, distilled.</h3>
              <div style={{ color: "var(--ink-3)", fontSize: 14, maxWidth: 360 }}>
                The starred entries become your backbone. Archives fold away quietly.
              </div>
              <div
                style={{
                  color: "var(--ink-2)",
                  fontSize: 14,
                  maxWidth: 420,
                  padding: "10px 12px",
                  border: "1px dashed var(--rule-strong)",
                  borderRadius: 10,
                  background: "var(--paper-2)",
                }}
              >
                Reflective question: Which of these signals brought you closer to your Fitrah?
              </div>
              <div className="stats">
                <div>
                  <strong>{starCount}</strong>Starred
                </div>
                <div>
                  <strong>{archiveCount}</strong>Archived
                </div>
                <div>
                  <strong>{promoteCount}</strong>Promoted
                </div>
              </div>
              <button
                className="save-btn"
                style={{ marginTop: 16 }}
                onClick={() => {
                  onApply(decisions);
                  onClose();
                }}
                type="button"
              >
                Apply & close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
