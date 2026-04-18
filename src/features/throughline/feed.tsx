import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CreateEntryPayload,
  FeedFilter,
  ThroughlineContextFilter,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProject,
} from "@/lib/types";
import { CodeBlock, extractTags, formatTime, Icon, renderContent } from "@/features/throughline/shared";

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
                    setSelectedGoals((state) => (state.includes(goal.id) ? state.filter((id) => id !== goal.id) : [...state, goal.id]))
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
                  <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</span>
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

interface FeedViewProps {
  activeGreeting: string;
  entries: ThroughlineEntry[];
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  groupedEntries: Array<{ day: string; items: ThroughlineEntry[] }>;
  filteredEntries: ThroughlineEntry[];
  filter: FeedFilter;
  setFilter: (filter: FeedFilter) => void;
  contextFilter: ThroughlineContextFilter | null;
  onClearContextFilter: () => void;
  onSetContextFilter: (filter: ThroughlineContextFilter) => void;
  onAddEntry: (payload: CreateEntryPayload) => void;
  onToggleStar: (entryId: string) => void;
}

export function FeedView({
  activeGreeting,
  entries,
  goals,
  projects,
  groupedEntries,
  filteredEntries,
  filter,
  setFilter,
  contextFilter,
  onClearContextFilter,
  onSetContextFilter,
  onAddEntry,
  onToggleStar,
}: FeedViewProps) {
  return (
    <main className="main">
      <div className="dateline">
        <span>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</span>
        <span className="rule" />
        <span>
          Week {Math.ceil(new Date().getDate() / 7)} - {entries.filter((entry) => !entry.isPivot).length} captures
        </span>
      </div>
      <h1 className="greeting">
        {activeGreeting}, Alex. <em>What's worth keeping?</em>
      </h1>

      <Capture goals={goals} projects={projects} onAdd={onAddEntry} />
      <FilterBar filter={filter} setFilter={setFilter} count={filteredEntries.filter((entry) => !entry.isPivot).length} />

      {contextFilter ? (
        <div className="filter-context">
          <span>Filtering to</span>
          <strong style={{ fontWeight: 600 }}>
            {contextFilter.type === "goal" && "◎ "}
            {contextFilter.label}
          </strong>
          <span style={{ opacity: 0.7, marginLeft: 4, fontFamily: "var(--f-mono)", fontSize: 11 }}>
            {filteredEntries.filter((entry) => !entry.isPivot).length} entries
          </span>
          <button className="close" onClick={onClearContextFilter} type="button">
            ×
          </button>
        </div>
      ) : null}

      <div className="feed">
        {groupedEntries.length === 0 && <div className="empty">Nothing here yet. The feed is listening.</div>}
        {groupedEntries.map((group) => (
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
                <Entry key={entry.id} entry={entry} goals={goals} projects={projects} onStar={onToggleStar} onFilter={onSetContextFilter} />
              ),
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
