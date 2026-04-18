"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_TWEAKS, SEED_ENTRIES, SEED_GOALS, SEED_MINIMAP, SEED_PROJECTS } from "@/lib/seed";
import { buildMinimap } from "@/lib/minimap";
import type {
  CreateEntryPayload,
  FeedFilter,
  MainView,
  MinimapWeek,
  ThroughlineBootstrap,
  ThroughlineContextFilter,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProject,
  ThroughlineTweaks,
} from "@/lib/types";

const ACCENTS = {
  indigo: {
    a: "oklch(0.45 0.14 270)",
    soft: "oklch(0.93 0.04 270)",
    ink: "oklch(0.32 0.12 270)",
    dA: "oklch(0.72 0.11 270)",
    dSoft: "oklch(0.28 0.06 270)",
    dInk: "oklch(0.85 0.12 270)",
  },
  clay: {
    a: "oklch(0.55 0.12 40)",
    soft: "oklch(0.94 0.03 40)",
    ink: "oklch(0.4 0.1 40)",
    dA: "oklch(0.75 0.1 40)",
    dSoft: "oklch(0.3 0.06 40)",
    dInk: "oklch(0.85 0.1 40)",
  },
  moss: {
    a: "oklch(0.48 0.1 150)",
    soft: "oklch(0.93 0.03 150)",
    ink: "oklch(0.35 0.08 150)",
    dA: "oklch(0.72 0.09 150)",
    dSoft: "oklch(0.28 0.05 150)",
    dInk: "oklch(0.85 0.08 150)",
  },
  ink: {
    a: "oklch(0.25 0.02 260)",
    soft: "oklch(0.9 0.01 260)",
    ink: "oklch(0.2 0.02 260)",
    dA: "oklch(0.85 0.02 260)",
    dSoft: "oklch(0.3 0.02 260)",
    dInk: "oklch(0.92 0.02 260)",
  },
  rose: {
    a: "oklch(0.55 0.14 10)",
    soft: "oklch(0.94 0.04 10)",
    ink: "oklch(0.4 0.11 10)",
    dA: "oklch(0.75 0.11 10)",
    dSoft: "oklch(0.3 0.06 10)",
    dInk: "oklch(0.85 0.11 10)",
  },
} as const;

const FONTS = {
  editorial: {
    display: 'var(--font-fraunces), "Source Serif 4", Georgia, serif',
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  sans: {
    display: 'var(--font-inter), system-ui, sans-serif',
    body: 'var(--font-inter), system-ui, sans-serif',
  },
  serif: {
    display: 'var(--font-fraunces), Georgia, serif',
    body: 'var(--font-source-serif), Georgia, serif',
  },
} as const;

const Icon = {
  Hash: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 6h10M3 10h10M6 3l-1 10M11 3l-1 10" />
    </svg>
  ),
  Code: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 5L3 8l3 3M10 5l3 3-3 3" />
    </svg>
  ),
  Link: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M7 9a3 3 0 004 0l2-2a3 3 0 10-4-4l-1 1M9 7a3 3 0 00-4 0l-2 2a3 3 0 004 4l1-1" />
    </svg>
  ),
  Paperclip: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 7L8 12a3 3 0 01-4-4l5-5a2 2 0 013 3l-5 5a1 1 0 01-2-1l4-4" />
    </svg>
  ),
  Star: (props: { size?: number; filled?: boolean }) => (
    <svg
      viewBox="0 0 16 16"
      width={props.size ?? 12}
      height={props.size ?? 12}
      fill={props.filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.4"
    >
      <path d="M8 2l1.8 3.7 4 .6-3 2.8.8 4-3.6-2-3.6 2 .8-4-3-2.8 4-.6z" />
    </svg>
  ),
  X: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 12} height={props.size ?? 12} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 4l8 8M12 4l-8 8" />
    </svg>
  ),
  Settings: (props: { size?: number }) => (
    <svg viewBox="0 0 16 16" width={props.size ?? 14} height={props.size ?? 14} fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2" />
      <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3.5 3.5l1.5 1.5M11 11l1.5 1.5M3.5 12.5L5 11M11 5l1.5-1.5" />
    </svg>
  ),
};

function applyTweaks(tweaks: ThroughlineTweaks) {
  const root = document.documentElement;
  root.dataset.theme = tweaks.theme;
  root.dataset.layout = tweaks.layout;
  root.dataset.density = tweaks.density;
  root.dataset.entry = tweaks.entry;

  const accent = ACCENTS[tweaks.accent] ?? ACCENTS.indigo;
  const isDark = tweaks.theme === "dark";
  root.style.setProperty("--accent", isDark ? accent.dA : accent.a);
  root.style.setProperty("--accent-soft", isDark ? accent.dSoft : accent.soft);
  root.style.setProperty("--accent-ink", isDark ? accent.dInk : accent.ink);

  const fonts = FONTS[tweaks.font] ?? FONTS.editorial;
  root.style.setProperty("--f-display", fonts.display);
  root.style.setProperty("--f-body", fonts.body);
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

function formatDay(iso: string) {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  if (target.getTime() === today.getTime()) {
    return `Today - ${date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}`;
  }
  if (target.getTime() === yesterday.getTime()) {
    return `Yesterday - ${date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" })}`;
  }

  return date.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
}

function extractTags(value: string) {
  const matches = value.match(/(^|\s)#([a-z0-9_-]+)/gi) ?? [];
  return [...new Set(matches.map((part) => part.trim().slice(1)))];
}

function renderContent(text: string) {
  const parts: React.ReactNode[] = [];
  const regex = /(https?:\/\/[^\s]+)|(#[a-z0-9_-]+)/gi;
  let last = 0;
  let index = 0;
  let match: RegExpExecArray | null = regex.exec(text);

  while (match) {
    if (match.index > last) {
      parts.push(text.slice(last, match.index));
    }
    if (match[1]) {
      parts.push(
        <a key={`u-${index}`} href={match[1]} onClick={(event) => event.preventDefault()}>
          {match[1]}
        </a>,
      );
    } else {
      parts.push(
        <span key={`t-${index}`} style={{ color: "var(--ink-3)", fontFamily: "var(--f-mono)", fontSize: "0.88em" }}>
          {match[2]}
        </span>,
      );
    }

    index += 1;
    last = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (last < text.length) {
    parts.push(text.slice(last));
  }

  return parts;
}

function CodeBlock({ content }: { content: string }) {
  const body = content.replace(/^```[a-z]*\n?/, "").replace(/```$/, "");
  return (
    <pre className="code-block">
      <code>{body}</code>
    </pre>
  );
}

function FilterBar({
  filter,
  setFilter,
  count,
}: {
  filter: FeedFilter;
  setFilter: (next: FeedFilter) => void;
  count: number;
}) {
  return (
    <div className="filter-bar">
      <span className="h">Captures - {count}</span>
      <div className="pill-group">
        <button className={`pill ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
          All
        </button>
        <button className={`pill ${filter === "starred" ? "active" : ""}`} onClick={() => setFilter("starred")}>
          Starred
        </button>
        <button className={`pill ${filter === "links" ? "active" : ""}`} onClick={() => setFilter("links")}>
          Links
        </button>
        <button className={`pill ${filter === "code" ? "active" : ""}`} onClick={() => setFilter("code")}>
          Code
        </button>
      </div>
    </div>
  );
}

function Masthead({
  onOpenTweaks,
  onView,
  view,
}: {
  onOpenTweaks: () => void;
  onView: (next: MainView) => void;
  view: MainView;
}) {
  return (
    <header className="masthead">
      <div className="masthead-inner">
        <div className="wordmark">
          <div className="glyph">T</div>
          <div className="name">
            Through<em>line</em>
          </div>
        </div>
        <nav className="nav">
          <a
            href="#"
            className={view === "feed" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              onView("feed");
            }}
          >
            Feed
          </a>
          <a
            href="#"
            className={view === "threads" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              onView("threads");
            }}
          >
            Threads
          </a>
          <a
            href="#"
            className={view === "map" ? "active" : ""}
            onClick={(event) => {
              event.preventDefault();
              onView("map");
            }}
          >
            Timeline
          </a>
          <span className="sep" />
          <a
            href="#"
            onClick={(event) => {
              event.preventDefault();
              onOpenTweaks();
            }}
          >
            <Icon.Settings />
            <span style={{ marginLeft: 4 }}>Tweaks</span>
          </a>
        </nav>
        <button className="me" type="button">
          <span>alex@throughline.co</span>
          <div className="avatar">AV</div>
        </button>
      </div>
    </header>
  );
}

function BigLineBar({
  goals,
  projects,
  onSlotClick,
  onStartReview,
  activeFilter,
}: {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onSlotClick: (type: "goal" | "project", id: string) => void;
  onStartReview: () => void;
  activeFilter: ThroughlineContextFilter | null;
}) {
  return (
    <div className="bigline-bar">
      <div className="bigline-inner">
        <div>
          <div className="bigline-label">
            <span>The Big Lines</span>
            <span className="rule" />
            <span style={{ opacity: 0.7 }}>5 slots - click to edit - pivots are tracked</span>
          </div>
          <div className="bigline-grid">
            {goals.map((goal, index) => (
              <div
                key={goal.id}
                className={`slot goal ${activeFilter?.type === "goal" && activeFilter.id === goal.id ? "active" : ""}`}
                onClick={() => onSlotClick("goal", goal.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSlotClick("goal", goal.id);
                }}
              >
                <div className="slot-kind">
                  <span className="dot" /> Life Goal 0{index + 1}
                </div>
                <div className="slot-text">{goal.name}</div>
              </div>
            ))}
            <div className="slot-divider" />
            {projects.map((project, index) => (
              <div
                key={project.id}
                className={`slot project ${activeFilter?.type === "project" && activeFilter.id === project.id ? "active" : ""}`}
                onClick={() => onSlotClick("project", project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") onSlotClick("project", project.id);
                }}
              >
                <div className="slot-kind">
                  <span className="dot" /> Project 0{index + 1}
                </div>
                <div className="slot-text">{project.name}</div>
              </div>
            ))}
          </div>
        </div>
        <button className="review-btn" onClick={onStartReview} type="button">
          Weekly review
          <span className="mono">12 - due Sun</span>
        </button>
      </div>
    </div>
  );
}

function Sidebar({
  goals,
  projects,
  onSlotClick,
  activeFilter,
  onStartReview,
}: {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onSlotClick: (type: "goal" | "project", id: string) => void;
  activeFilter: ThroughlineContextFilter | null;
  onStartReview: () => void;
}) {
  return (
    <aside className="sidebar">
      <div className="wordmark" style={{ marginBottom: 8 }}>
        <div className="glyph">T</div>
        <div className="name">
          Through<em>line</em>
        </div>
      </div>
      <div>
        <h3>Life goals</h3>
        {goals.map((goal, index) => (
          <div
            key={goal.id}
            className={`item ${activeFilter?.type === "goal" && activeFilter.id === goal.id ? "active" : ""}`}
            onClick={() => onSlotClick("goal", goal.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSlotClick("goal", goal.id);
            }}
          >
            <span className="kind">Goal 0{index + 1}</span>
            <span className="t">{goal.name}</span>
          </div>
        ))}
      </div>
      <div>
        <h3>Projects</h3>
        {projects.map((project, index) => (
          <div
            key={project.id}
            className={`item ${activeFilter?.type === "project" && activeFilter.id === project.id ? "active" : ""}`}
            onClick={() => onSlotClick("project", project.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") onSlotClick("project", project.id);
            }}
          >
            <span className="kind">Project 0{index + 1}</span>
            <span className="t">{project.name}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: "auto" }}>
        <button className="review-btn" style={{ width: "100%" }} onClick={onStartReview} type="button">
          Weekly review
        </button>
      </div>
    </aside>
  );
}

function Entry({
  entry,
  goals,
  projects,
  onStar,
  onFilter,
}: {
  entry: ThroughlineEntry;
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onStar: (id: string) => void;
  onFilter: (filter: ThroughlineContextFilter) => void;
}) {
  const goalObjects = (entry.goals ?? [])
    .map((id) => goals.find((goal) => goal.id === id))
    .filter((goal): goal is ThroughlineGoal => Boolean(goal));
  const projectObjects = (entry.projects ?? [])
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is ThroughlineProject => Boolean(project));
  const tags = entry.tags ?? [];

  return (
    <article className={`entry ${entry.starred ? "starred" : ""}${entry.archived ? " archived" : ""}`}>
      <span className="timestamp">{formatTime(entry.created_at)}</span>
      <span className="dot" />
      {(goalObjects.length > 0 || projectObjects.length > 0 || tags.length > 0) && (
        <div className="meta">
          {goalObjects.map((goal) => (
            <span key={goal.id} className="goal" onClick={() => onFilter({ type: "goal", id: goal.id, label: goal.name })}>
              ◎ {goal.name}
            </span>
          ))}
          {projectObjects.map((project) => (
            <span
              key={project.id}
              className="project"
              onClick={() => onFilter({ type: "project", id: project.id, label: project.name })}
            >
              {project.name}
            </span>
          ))}
          {tags.map((tag) => (
            <span key={tag} className="tag" onClick={() => onFilter({ type: "tag", id: tag, label: `#${tag}` })}>
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="content">
        {entry.isCode ? <CodeBlock content={entry.content} /> : renderContent(entry.content)}
        {entry.link ? (
          <div className="link-preview">
            <div className="thumb">link.preview</div>
            <div className="txt">
              <div className="h">{entry.link.title}</div>
              <div className="d">{entry.link.desc}</div>
              <div className="u">{entry.link.url}</div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="actions">
        <button className={`action star ${entry.starred ? "on" : ""}`} onClick={() => onStar(entry.id)} type="button">
          <Icon.Star filled={entry.starred} /> {entry.starred ? "Starred" : "Star"}
        </button>
        <button className="action" type="button">
          Promote ↑
        </button>
        <button className="action" type="button">
          Reply
        </button>
        <button className="action" type="button">
          Copy
        </button>
      </div>
    </article>
  );
}

function PivotMarker({ pivot }: { pivot: ThroughlineEntry }) {
  return (
    <div className="pivot">
      <div className="head">
        Pivot - {new Date(pivot.created_at).toLocaleDateString([], { month: "short", day: "numeric" })} - {pivot.slotKind}
      </div>
      <div className="body">
        <span className="from">{pivot.from}</span> -&gt; <span className="to">{pivot.to}</span>
      </div>
    </div>
  );
}

function Minimap({ data }: { data: MinimapWeek[] }) {
  return (
    <div className="minimap">
      <div className="title">8 wks - scroll back</div>
      {data.map((week, index) => (
        <div key={`${week.week}-${index}`} className="wk">
          <span className="blocks">
            {[0, 1, 2, 3, 4, 5, 6].map((day) => {
              const levelClass =
                week.level >= 3
                  ? day % 2 === 0
                    ? "l3"
                    : "l2"
                  : week.level === 2
                    ? day < 4
                      ? "l2"
                      : "l1"
                    : week.level === 1
                      ? day < 2
                        ? "l1"
                        : ""
                      : "";

              return <span key={day} className={levelClass} />;
            })}
          </span>
          <span>{week.week}</span>
          {week.pivot ? <span className="pivot" title="Pivot this week" /> : null}
        </div>
      ))}
    </div>
  );
}

function Capture({
  goals,
  projects,
  onAdd,
}: {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onAdd: (payload: CreateEntryPayload) => void;
}) {
  const [value, setValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isCode, setIsCode] = useState(false);

  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const pickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        textAreaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!picker) return;
    const closeOutside = (event: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
        setPicker(false);
      }
    };
    document.addEventListener("mousedown", closeOutside);
    return () => document.removeEventListener("mousedown", closeOutside);
  }, [picker]);

  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.style.height = "auto";
    textAreaRef.current.style.height = `${Math.min(textAreaRef.current.scrollHeight, 360)}px`;
  }, [value]);

  const tags = useMemo(() => extractTags(value), [value]);
  const selectedCount = selectedGoals.length + selectedProjects.length;

  const submit = useCallback(() => {
    if (!value.trim()) return;
    onAdd({
      content: value.trim(),
      goals: selectedGoals,
      projects: selectedProjects,
      tags,
      isCode,
    });
    setValue("");
    setSelectedGoals([]);
    setSelectedProjects([]);
    setIsCode(false);
  }, [isCode, onAdd, selectedGoals, selectedProjects, tags, value]);

  const onKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
    if (event.key === "Escape") setPicker(false);
  };

  return (
    <div
      className={`capture ${focused ? "focused" : ""}`}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <textarea
        ref={textAreaRef}
        className="capture-textarea"
        rows={2}
        placeholder="What's the throughline today?"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={onKeyDown}
      />

      {(selectedCount > 0 || tags.length > 0) && (
        <div className="capture-chips">
          {goals
            .filter((goal) => selectedGoals.includes(goal.id))
            .map((goal) => (
              <span key={goal.id} className="chip selected">
                <span className="k">Goal</span> {goal.name}
                <span className="x" onClick={() => setSelectedGoals((state) => state.filter((id) => id !== goal.id))}>
                  <Icon.X size={8} />
                </span>
              </span>
            ))}
          {projects
            .filter((project) => selectedProjects.includes(project.id))
            .map((project) => (
              <span key={project.id} className="chip selected">
                <span className="k">Project</span> {project.name}
                <span className="x" onClick={() => setSelectedProjects((state) => state.filter((id) => id !== project.id))}>
                  <Icon.X size={8} />
                </span>
              </span>
            ))}
          {tags.map((tag) => (
            <span key={tag} className="chip">
              #{tag}
            </span>
          ))}
        </div>
      )}

      <div className="capture-toolbar">
        <div className="tool-left" ref={pickerRef} style={{ position: "relative" }}>
          <button className="tool-btn" title="Link to goal / project" onClick={() => setPicker((state) => !state)} type="button">
            <Icon.Paperclip />
          </button>
          <button
            className={`tool-btn ${isCode ? "active" : ""}`}
            title="Code block"
            onClick={() => setIsCode((state) => !state)}
            type="button"
          >
            <Icon.Code />
          </button>
          <button className="tool-btn" title="Insert link" type="button">
            <Icon.Link />
          </button>
          <button
            className="tool-btn"
            title="Insert tag"
            type="button"
            onClick={() => {
              setValue((state) => `${state}${state.endsWith(" ") || !state ? "#" : " #"}`);
              textAreaRef.current?.focus();
            }}
          >
            <Icon.Hash />
          </button>

          {picker && (
            <div className="link-picker">
              <div className="group">Life Goals</div>
              {goals.map((goal) => (
                <button
                  key={goal.id}
                  className={`link-option goal ${selectedGoals.includes(goal.id) ? "selected" : ""}`}
                  onClick={() =>
                    setSelectedGoals((state) =>
                      state.includes(goal.id) ? state.filter((id) => id !== goal.id) : [...state, goal.id],
                    )
                  }
                  type="button"
                >
                  <span className="dot" />
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{goal.name}</span>
                  <span className="check">✓</span>
                </button>
              ))}
              <div className="group" style={{ borderTop: "1px solid var(--rule)", marginTop: 4, paddingTop: 8 }}>
                Projects
              </div>
              {projects.map((project) => (
                <button
                  key={project.id}
                  className={`link-option project ${selectedProjects.includes(project.id) ? "selected" : ""}`}
                  onClick={() =>
                    setSelectedProjects((state) =>
                      state.includes(project.id) ? state.filter((id) => id !== project.id) : [...state, project.id],
                    )
                  }
                  type="button"
                >
                  <span className="dot" />
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {project.name}
                  </span>
                  <span className="check">✓</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="tool-right">
          <span className="hint">
            <span className="kbd">⌘K</span> to focus - <span className="kbd">⏎</span> to save
          </span>
          <button className="save-btn" disabled={!value.trim()} onClick={submit} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function WeeklyReview({
  entries,
  onClose,
  onApply,
}: {
  entries: ThroughlineEntry[];
  onClose: () => void;
  onApply: (decisions: Record<string, "star" | "archive" | "promote" | "skip">) => void;
}) {
  const candidates = useMemo(
    () => entries.filter((entry) => !entry.isPivot && !entry.starred && !entry.archived).slice(0, 8),
    [entries],
  );
  const [index, setIndex] = useState(0);
  const [decisions, setDecisions] = useState<Record<string, "star" | "archive" | "promote" | "skip">>({});

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

function TweaksPanel({
  open,
  onClose,
  tweaks,
  setTweak,
}: {
  open: boolean;
  onClose: () => void;
  tweaks: ThroughlineTweaks;
  setTweak: <K extends keyof ThroughlineTweaks>(key: K, value: ThroughlineTweaks[K]) => void;
}) {
  const accents = [
    { id: "indigo", color: "oklch(0.45 0.14 270)" },
    { id: "clay", color: "oklch(0.55 0.12 40)" },
    { id: "moss", color: "oklch(0.48 0.1 150)" },
    { id: "ink", color: "oklch(0.25 0.02 260)" },
    { id: "rose", color: "oklch(0.58 0.14 10)" },
  ] as const;

  return (
    <div className={`tweaks-panel ${open ? "open" : ""}`}>
      <h4>
        Tweaks
        <button onClick={onClose} type="button">
          ×
        </button>
      </h4>

      <div className="tweak-row">
        <label>Theme</label>
        <div className="seg">
          {(["light", "dark"] as const).map((value) => (
            <button key={value} className={tweaks.theme === value ? "on" : ""} onClick={() => setTweak("theme", value)} type="button">
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Accent</label>
        <div className="hues">
          {accents.map((accent) => (
            <span
              key={accent.id}
              className={`hue ${tweaks.accent === accent.id ? "on" : ""}`}
              style={{ background: accent.color }}
              onClick={() => setTweak("accent", accent.id)}
            />
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Layout</label>
        <div className="seg">
          <button className={tweaks.layout === "top" ? "on" : ""} onClick={() => setTweak("layout", "top")} type="button">
            Top bar
          </button>
          <button className={tweaks.layout === "sidebar" ? "on" : ""} onClick={() => setTweak("layout", "sidebar")} type="button">
            Sidebar
          </button>
        </div>
      </div>

      <div className="tweak-row">
        <label>Density</label>
        <div className="seg">
          {(["airy", "balanced", "dense"] as const).map((value) => (
            <button key={value} className={tweaks.density === value ? "on" : ""} onClick={() => setTweak("density", value)} type="button">
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="tweak-row">
        <label>Entry style</label>
        <div className="seg">
          <button className={tweaks.entry === "journal" ? "on" : ""} onClick={() => setTweak("entry", "journal")} type="button">
            Journal
          </button>
          <button className={tweaks.entry === "card" ? "on" : ""} onClick={() => setTweak("entry", "card")} type="button">
            Card
          </button>
          <button className={tweaks.entry === "line" ? "on" : ""} onClick={() => setTweak("entry", "line")} type="button">
            Line
          </button>
        </div>
      </div>

      <div className="tweak-row">
        <label>Type pairing</label>
        <div className="seg">
          <button className={tweaks.font === "editorial" ? "on" : ""} onClick={() => setTweak("font", "editorial")} type="button">
            Editorial
          </button>
          <button className={tweaks.font === "sans" ? "on" : ""} onClick={() => setTweak("font", "sans")} type="button">
            Sans
          </button>
          <button className={tweaks.font === "serif" ? "on" : ""} onClick={() => setTweak("font", "serif")} type="button">
            Serif
          </button>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const [goals, setGoals] = useState<ThroughlineGoal[]>(SEED_GOALS);
  const [projects, setProjects] = useState<ThroughlineProject[]>(SEED_PROJECTS);
  const [entries, setEntries] = useState<ThroughlineEntry[]>(SEED_ENTRIES);

  const [tweaks, setTweaks] = useState<ThroughlineTweaks>(() => {
    try {
      const saved = localStorage.getItem("throughline-tweaks");
      return saved ? { ...DEFAULT_TWEAKS, ...JSON.parse(saved) } : { ...DEFAULT_TWEAKS };
    } catch {
      return { ...DEFAULT_TWEAKS };
    }
  });
  const [tweaksOpen, setTweaksOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [view, setView] = useState<MainView>("feed");
  const [filter, setFilter] = useState<FeedFilter>("all");
  const [contextFilter, setContextFilter] = useState<ThroughlineContextFilter | null>(null);

  useEffect(() => {
    applyTweaks(tweaks);
    localStorage.setItem("throughline-tweaks", JSON.stringify(tweaks));
    if (editMode) {
      window.parent?.postMessage({ type: "__edit_mode_set_keys", edits: tweaks }, "*");
    }
  }, [tweaks, editMode]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === "__activate_edit_mode") {
        setEditMode(true);
        setTweaksOpen(true);
      }
      if (event.data?.type === "__deactivate_edit_mode") {
        setEditMode(false);
        setTweaksOpen(false);
      }
    };
    window.addEventListener("message", onMessage);
    window.parent?.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/bootstrap", { method: "GET" });
        if (!response.ok) return;
        const data = (await response.json()) as ThroughlineBootstrap;
        if (!cancelled) {
          setGoals(data.goals);
          setProjects(data.projects);
          setEntries(data.entries);
        }
      } catch {
        // Keep the seed data fallback on failure.
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTweak = <K extends keyof ThroughlineTweaks>(key: K, value: ThroughlineTweaks[K]) => {
    setTweaks((state) => ({ ...state, [key]: value }));
  };

  const addEntry = useCallback(async (payload: CreateEntryPayload) => {
    try {
      const response = await fetch("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) return;
      const created = (await response.json()) as ThroughlineEntry;
      setEntries((state) => [created, ...state]);
    } catch {
      const fallback: ThroughlineEntry = {
        id: `e-${Date.now()}`,
        content: payload.content,
        goals: payload.goals ?? [],
        projects: payload.projects ?? [],
        tags: payload.tags ?? [],
        isCode: payload.isCode,
        created_at: new Date().toISOString(),
        starred: false,
      };
      setEntries((state) => [fallback, ...state]);
    }
  }, []);

  const toggleStar = useCallback(async (id: string) => {
    let nextStarred = false;
    setEntries((state) =>
      state.map((entry) => {
        if (entry.id !== id) return entry;
        nextStarred = !entry.starred;
        return { ...entry, starred: nextStarred };
      }),
    );
    try {
      await fetch(`/api/entries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: nextStarred }),
      });
    } catch {
      // Preserve optimistic update.
    }
  }, []);

  const onSlotClick = (type: "goal" | "project", id: string) => {
    const source = type === "goal" ? goals.find((goal) => goal.id === id) : projects.find((project) => project.id === id);
    if (!source) return;
    if (contextFilter && contextFilter.type === type && contextFilter.id === id) {
      setContextFilter(null);
    } else {
      setContextFilter({ type, id, label: source.name });
    }
  };

  const filtered = useMemo(() => {
    let list = entries;
    if (contextFilter) {
      list = list.filter((entry) => {
        if (entry.isPivot) return false;
        if (contextFilter.type === "goal") return (entry.goals ?? []).includes(contextFilter.id);
        if (contextFilter.type === "project") return (entry.projects ?? []).includes(contextFilter.id);
        if (contextFilter.type === "tag") return (entry.tags ?? []).includes(contextFilter.id);
        return true;
      });
    }
    if (filter === "starred") list = list.filter((entry) => entry.starred && !entry.isPivot);
    if (filter === "links") list = list.filter((entry) => entry.link || /https?:\/\//.test(entry.content));
    if (filter === "code") list = list.filter((entry) => entry.isCode);
    return list;
  }, [entries, filter, contextFilter]);

  const grouped = useMemo(() => {
    const groups: Array<{ day: string; items: ThroughlineEntry[] }> = [];
    let current: { day: string; items: ThroughlineEntry[] } | null = null;
    for (const entry of filtered) {
      const day = formatDay(entry.created_at);
      if (!current || current.day !== day) {
        current = { day, items: [] };
        groups.push(current);
      }
      current.items.push(entry);
    }
    return groups;
  }, [filtered]);

  const applyReview = useCallback((decisions: Record<string, "star" | "archive" | "promote" | "skip">) => {
    setEntries((state) =>
      state.map((entry) => {
        const decision = decisions[entry.id];
        if (!decision) return entry;
        if (decision === "star") return { ...entry, starred: true };
        if (decision === "archive") return { ...entry, archived: true };
        return entry;
      }),
    );

    void Promise.all(
      Object.entries(decisions).map(async ([id, decision]) => {
        if (decision === "skip" || decision === "promote") return;
        const patch = decision === "star" ? { starred: true } : { archived: true };
        await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
      }),
    );
  }, []);

  const activeGreeting = useMemo(() => {
    const hours = new Date().getHours();
    if (hours < 5) return "Late night";
    if (hours < 12) return "Good morning";
    if (hours < 18) return "Afternoon";
    return "Evening";
  }, []);

  const minimap = useMemo<MinimapWeek[]>(
    () => (entries.length > 0 ? buildMinimap(entries) : SEED_MINIMAP),
    [entries],
  );

  return (
    <>
      <Sidebar goals={goals} projects={projects} activeFilter={contextFilter} onSlotClick={onSlotClick} onStartReview={() => setReviewOpen(true)} />
      <Masthead onOpenTweaks={() => setTweaksOpen(true)} onView={setView} view={view} />
      <BigLineBar
        goals={goals}
        projects={projects}
        activeFilter={contextFilter}
        onSlotClick={onSlotClick}
        onStartReview={() => setReviewOpen(true)}
      />
      <Minimap data={minimap} />

      <main className="main">
        <div className="dateline">
          <span>
            {new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}
          </span>
          <span className="rule" />
          <span>
            Week {Math.ceil(new Date().getDate() / 7)} - {entries.filter((entry) => !entry.isPivot).length} captures
          </span>
        </div>
        <h1 className="greeting">
          {activeGreeting}, Alex. <em>What's worth keeping?</em>
        </h1>

        <Capture goals={goals} projects={projects} onAdd={addEntry} />
        <FilterBar filter={filter} setFilter={setFilter} count={filtered.filter((entry) => !entry.isPivot).length} />

        {contextFilter ? (
          <div className="filter-context">
            <span>Filtering to</span>
            <strong style={{ fontWeight: 600 }}>
              {contextFilter.type === "goal" && "◎ "}
              {contextFilter.label}
            </strong>
            <span style={{ opacity: 0.7, marginLeft: 4, fontFamily: "var(--f-mono)", fontSize: 11 }}>
              {filtered.filter((entry) => !entry.isPivot).length} entries
            </span>
            <button className="close" onClick={() => setContextFilter(null)} type="button">
              ×
            </button>
          </div>
        ) : null}

        <div className="feed">
          {grouped.length === 0 && <div className="empty">Nothing here yet. The feed is listening.</div>}
          {grouped.map((group) => (
            <div key={group.day}>
              <div className="day-divider">
                <span>{group.day}</span>
                <span className="rule" />
                <span>{group.items.filter((entry) => !entry.isPivot).length}</span>
              </div>
              {group.items.map((entry) =>
                entry.isPivot ? (
                  <PivotMarker key={entry.id} pivot={entry} />
                ) : (
                  <Entry key={entry.id} entry={entry} goals={goals} projects={projects} onStar={toggleStar} onFilter={setContextFilter} />
                ),
              )}
            </div>
          ))}
        </div>
      </main>

      {reviewOpen ? <WeeklyReview entries={entries} onClose={() => setReviewOpen(false)} onApply={applyReview} /> : null}
      <TweaksPanel open={tweaksOpen} onClose={() => setTweaksOpen(false)} tweaks={tweaks} setTweak={setTweak} />

      {!tweaksOpen ? (
        <button
          onClick={() => setTweaksOpen(true)}
          style={{
            position: "fixed",
            bottom: 20,
            right: 20,
            zIndex: 40,
            padding: "10px 14px",
            borderRadius: 999,
            border: "1px solid var(--rule-strong)",
            background: "var(--card)",
            color: "var(--ink-2)",
            fontSize: 12,
            cursor: "pointer",
            boxShadow: "0 8px 20px -8px rgba(0,0,0,0.15)",
            display: "inline-flex",
            gap: 6,
            alignItems: "center",
          }}
          type="button"
        >
          <Icon.Settings /> Tweaks
        </button>
      ) : null}
    </>
  );
}
