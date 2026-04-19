import { useEffect, useMemo, useState } from "react";
import type {
  CreateGoalPayload,
  CreateProjectPayload,
  GoalStatus,
  ThroughlineGoal,
  ThroughlineProject,
  UpdateGoalPayload,
  UpdateProjectPayload,
} from "@/lib/types";

type ComposerKind = "goal" | "project";

const COLOR_CHOICES = [
  "oklch(0.45 0.14 270)",
  "oklch(0.55 0.12 40)",
  "oklch(0.48 0.10 150)",
  "oklch(0.55 0.14 10)",
  "oklch(0.25 0.02 260)",
];

export type ComposerSubmitPayload =
  | { kind: "goal"; id?: string; payload: CreateGoalPayload | UpdateGoalPayload }
  | { kind: "project"; id?: string; payload: CreateProjectPayload | UpdateProjectPayload };

export function GoalProjectComposer({
  open,
  initialKind,
  editingGoal,
  editingProject,
  preselectedGoalId,
  goals,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initialKind: ComposerKind;
  editingGoal: ThroughlineGoal | null;
  editingProject: ThroughlineProject | null;
  preselectedGoalId?: string | null;
  goals: ThroughlineGoal[];
  onClose: () => void;
  onSubmit: (payload: ComposerSubmitPayload) => Promise<void> | void;
}) {
  const [kind, setKind] = useState<ComposerKind>(initialKind);
  const [name, setName] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [color, setColor] = useState(COLOR_CHOICES[0]);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [status, setStatus] = useState<GoalStatus>("active");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    const mode = editingGoal ? "goal" : editingProject ? "project" : initialKind;
    setKind(mode);
    if (editingGoal) {
      setName(editingGoal.name);
      setTargetDate(editingGoal.target_date ?? "");
      setColor(editingGoal.color ?? COLOR_CHOICES[0]);
      setGoalId(null);
      setStatus(editingGoal.status ?? "active");
      return;
    }
    if (editingProject) {
      setName(editingProject.name);
      setTargetDate(editingProject.target_date ?? "");
      setColor(editingProject.color ?? goals.find((goal) => goal.id === editingProject.goal_id)?.color ?? COLOR_CHOICES[0]);
      setGoalId(editingProject.goal_id ?? null);
      setStatus(editingProject.status ?? "active");
      return;
    }
    setName("");
    setTargetDate("");
    setGoalId(preselectedGoalId ?? null);
    setColor(goals.find((goal) => goal.id === preselectedGoalId)?.color ?? COLOR_CHOICES[0]);
    setStatus("active");
  }, [open, initialKind, editingGoal, editingProject, preselectedGoalId, goals]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const title = useMemo(() => {
    if (kind === "goal") return editingGoal ? "Edit life goal" : "Add life goal";
    return editingProject ? "Edit project" : "Add project";
  }, [editingGoal, editingProject, kind]);

  if (!open) return null;

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed || isSaving) return;
    setIsSaving(true);
    try {
      if (kind === "goal") {
        await onSubmit({
          kind: "goal",
          id: editingGoal?.id,
          payload: {
            name: trimmed,
            color,
            target_date: targetDate || undefined,
            status,
          },
        });
      } else {
        await onSubmit({
          kind: "project",
          id: editingProject?.id,
          payload: {
            name: trimmed,
            goal_id: goalId,
            color: goalId ? goals.find((goal) => goal.id === goalId)?.color ?? color : color,
            target_date: targetDate || undefined,
            status,
          },
        });
      }
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal composer-modal">
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            <div className="sub">One composer for both create and edit. Keep naming and attachment decisions in one place.</div>
          </div>
          <button className="close" onClick={onClose} type="button">
            ×
          </button>
        </div>
        <div className="modal-body">
          <div className="composer-type-switch">
            <button className={kind === "goal" ? "on" : ""} onClick={() => setKind("goal")} type="button">
              Life goal
            </button>
            <button className={kind === "project" ? "on" : ""} onClick={() => setKind("project")} type="button">
              Project
            </button>
          </div>

          <div className="composer-field">
            <label>Name</label>
            <input
              className="composer-input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={kind === "goal" ? "Name the line you want to pursue" : "Name the project you want to ship"}
              autoFocus
            />
          </div>

          <div className="composer-field">
            <label className="composer-label">Status</label>
            <div className="composer-type-switch">
              {(["active", "paused", "someday"] as const).map((s) => (
                <button
                  key={s}
                  className={`status-choice ${s}${status === s ? " on" : ""}`}
                  onClick={() => setStatus(s)}
                  type="button"
                >
                  <span className="status-choice-dot" />
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {kind === "project" ? (
            <div className="composer-field">
              <label>Feeds into</label>
              <div className="goal-pills">
                {goals.map((goal) => (
                  <button
                    key={goal.id}
                    className={goalId === goal.id ? "on" : ""}
                    onClick={() => setGoalId(goal.id)}
                    type="button"
                  >
                    {goal.name}
                  </button>
                ))}
                <button className={goalId === null ? "on standalone" : "standalone"} onClick={() => setGoalId(null)} type="button">
                  Standalone
                </button>
              </div>
            </div>
          ) : null}

          <div className="composer-grid">
            <div className="composer-field">
              <label>Target date</label>
              <input className="composer-input" type="date" value={targetDate} onChange={(event) => setTargetDate(event.target.value)} />
            </div>
            <div className="composer-field">
              <label>Color</label>
              <div className="color-pills">
                {COLOR_CHOICES.map((choice) => (
                  <button
                    key={choice}
                    className={color === choice ? "on" : ""}
                    style={{ background: choice }}
                    onClick={() => setColor(choice)}
                    type="button"
                    aria-label={`Select color ${choice}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="composer-footer">
          <button className="cancel" onClick={onClose} type="button">
            Cancel
          </button>
          <button className="save-btn" onClick={submit} disabled={!name.trim() || isSaving} type="button">
            {isSaving ? "Saving..." : editingGoal || editingProject ? "Save changes" : kind === "goal" ? "Add goal" : "Add project"}
          </button>
        </div>
      </div>
    </div>
  );
}
