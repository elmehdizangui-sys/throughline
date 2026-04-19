"use client";

import { type KeyboardEvent, useRef, useState } from "react";
import type { ThroughlineWeekCommitment } from "@/lib/types";

interface CommitmentsWidgetProps {
  weekKey: string;
  commitments: ThroughlineWeekCommitment[];
  onAdd: (text: string) => Promise<void>;
  onToggle: (id: string, done: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

function formatWeekKey(key: string): string {
  const [year, weekPart] = key.split("-W");
  const week = parseInt(weekPart ?? "1", 10);
  const jan1 = new Date(Date.UTC(parseInt(year ?? "2026", 10), 0, 1));
  const dayOfWeek = jan1.getUTCDay() || 7;
  const startMs = jan1.getTime() + (week - 1) * 7 * 86400000 - (dayOfWeek - 1) * 86400000;
  const start = new Date(startMs);
  return start.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function CommitmentsWidget({ weekKey, commitments, onAdd, onToggle, onDelete }: CommitmentsWidgetProps) {
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const done = commitments.filter((c) => c.done).length;
  const total = commitments.length;

  const handleAdd = async () => {
    const text = draft.trim();
    if (!text || adding) return;
    setAdding(true);
    try {
      await onAdd(text);
      setDraft("");
    } finally {
      setAdding(false);
    }
  };

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") void handleAdd();
    if (e.key === "Escape") setDraft("");
  };

  return (
    <div className="commitments-widget">
      <div className="commitments-header">
        <span className="commitments-label">
          This week <span className="commitments-week-date">{formatWeekKey(weekKey)}</span>
        </span>
        {total > 0 && (
          <span className="commitments-progress">
            {done}/{total}
          </span>
        )}
      </div>

      {commitments.length > 0 && (
        <ul className="commitments-list">
          {commitments.map((c) => (
            <li key={c.id} className={`commitment-item${c.done ? " done" : ""}`}>
              <button
                className="commitment-check"
                onClick={() => void onToggle(c.id, !c.done)}
                type="button"
                aria-label={c.done ? "Mark incomplete" : "Mark complete"}
              >
                {c.done ? (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
                    <path d="M4 7l2.5 2.5L10 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                    <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
                  </svg>
                )}
              </button>
              <span className="commitment-text">{c.text}</span>
              <button
                className="commitment-delete"
                onClick={() => void onDelete(c.id)}
                type="button"
                aria-label="Delete"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </li>
          ))}
        </ul>
      )}

      {total < 5 && (
        <div className="commitment-add">
          <input
            ref={inputRef}
            className="commitment-input"
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Add a commitment…"
            maxLength={200}
          />
          {draft.trim() && (
            <button
              className="commitment-submit"
              onClick={() => void handleAdd()}
              disabled={adding}
              type="button"
            >
              Add
            </button>
          )}
        </div>
      )}
    </div>
  );
}
