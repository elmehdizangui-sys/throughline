import { type ComponentType, type KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  CreateEntryPayload,
  EntryPriority,
  FeedFilter,
  HeartState,
  ThroughlineLink,
  ThroughlineContextFilter,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProject,
} from "@/lib/types";
import {
  CodeBlock,
  encodeBlockNoteContent,
  extractTags,
  formatTime,
  getEntryPlainText,
  Icon,
  renderContent,
} from "@/features/throughline/shared";

function normalizeHttpUrl(raw: string) {
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function firstLinkFromText(text: string): ThroughlineLink | undefined {
  const match = text.match(/https?:\/\/[^\s]+/i);
  if (!match) return undefined;
  const normalized = normalizeHttpUrl(match[0]);
  if (!normalized) return undefined;
  const parsed = new URL(normalized);
  return {
    url: normalized,
    title: parsed.hostname,
    desc: "Added from capture",
  };
}

function getTimePlaceholder(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Late night thoughts…";
  if (hour < 10) return "What's on your mind this morning?";
  if (hour < 12) return "What are you working on?";
  if (hour < 14) return "Midday capture…";
  if (hour < 17) return "What's happening?";
  if (hour < 20) return "Evening reflection…";
  return "End of day… what mattered?";
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

function Entry({
  entry,
  goals,
  projects,
  onStar,
  onPromote,
  onMarkPivot,
  onFilter,
  akhirahLens,
}: {
  entry: ThroughlineEntry;
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onStar: (id: string) => void;
  onPromote: (id: string) => void;
  onMarkPivot: (id: string) => void;
  onFilter: (filter: ThroughlineContextFilter) => void;
  akhirahLens?: boolean;
}) {
  const goalObjects = (entry.goals ?? [])
    .map((id) => goals.find((goal) => goal.id === id))
    .filter((goal): goal is ThroughlineGoal => Boolean(goal));
  const projectObjects = (entry.projects ?? [])
    .map((id) => projects.find((project) => project.id === id))
    .filter((project): project is ThroughlineProject => Boolean(project));
  const tags = entry.tags ?? [];

  const lensClass = akhirahLens
    ? entry.priority === "dunya"
      ? "akhirah-dim"
      : entry.priority === "akhirah"
        ? "akhirah-highlight"
        : ""
    : "";

  return (
    <article className={`entry ${entry.starred ? "starred" : ""}${entry.archived ? " archived" : ""}${lensClass ? ` ${lensClass}` : ""}`}>
      <span className="timestamp">{formatTime(entry.created_at)}</span>
      <span className="dot" />
      {(entry.priority || entry.signal || goalObjects.length > 0 || projectObjects.length > 0 || tags.length > 0) && (
        <div className="meta">
          {entry.priority ? (
            <span className={`priority ${entry.priority}`}>{entry.priority === "akhirah" ? "Akhirah - Legacy" : "Dunya - Immediate"}</span>
          ) : null}
          {entry.signal ? <span className="signal">Signal</span> : null}
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
            <div className="thumb" aria-hidden="true">link.preview</div>
            <div className="txt">
              <div className="h">{entry.link.title}</div>
              {entry.link.desc ? <div className="d">{entry.link.desc}</div> : null}
              <div className="u">{entry.link.url}</div>
            </div>
          </div>
        ) : null}
      </div>
      <div className="actions">
        <button className={`action star ${entry.starred ? "on" : ""}`} onClick={() => onStar(entry.id)} type="button">
          <Icon.Star filled={entry.starred} /> {entry.starred ? "Starred" : "Star"}
        </button>
        <button className={`action promote ${entry.signal ? "on" : ""}`} onClick={() => onPromote(entry.id)} type="button">
          {entry.signal ? "Promoted" : "Promote ↑"}
        </button>
        <button className="action" onClick={() => onMarkPivot(entry.id)} type="button">
          Mark as pivot
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
  const hasTransition = Boolean(pivot.from && pivot.to);
  const label = pivot.pivotLabel || pivot.to || getEntryPlainText(pivot.content) || "Pivot";

  return (
    <div className="pivot">
      <div className="head">
        Pivot - {new Date(pivot.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}
        {pivot.slotKind ? ` - ${pivot.slotKind}` : ""}
      </div>
      <div className="body">
        {hasTransition ? (
          <>
            <span className="from">{pivot.from}</span> -&gt; <span className="to">{pivot.to}</span>
          </>
        ) : (
          <span className="to">{label}</span>
        )}
      </div>
    </div>
  );
}

interface BlockNoteRuntimeEditor {
  document: unknown[];
  focus: () => void;
  insertInlineContent: (content: string) => void;
  replaceBlocks: (blocksToRemove: unknown[], blocksToInsert: Array<{ type: string; content?: string }>) => void;
  blocksToMarkdownLossy: (blocks?: unknown[]) => string;
  blocksToHTMLLossy: (blocks?: unknown[]) => string;
  tryParseMarkdownToBlocks: (markdown: string) => unknown[];
}

interface BlockNoteRuntimeViewProps {
  editor: BlockNoteRuntimeEditor;
  className?: string;
  "aria-label"?: string;
  onChange?: () => void;
  onKeyDownCapture?: (event: ReactKeyboardEvent<HTMLDivElement>) => void;
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
  const [blockNoteView, setBlockNoteView] = useState<ComponentType<BlockNoteRuntimeViewProps> | null>(null);
  const [editor, setEditor] = useState<BlockNoteRuntimeEditor | null>(null);
  const [markdownValue, setMarkdownValue] = useState("");
  const [htmlValue, setHtmlValue] = useState("");
  const [focused, setFocused] = useState(false);
  const [picker, setPicker] = useState(false);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [isCode, setIsCode] = useState(false);
  const [priority, setPriority] = useState<EntryPriority | null>(null);
  const [stateOfHeart, setStateOfHeart] = useState<HeartState | null>(null);

  const pickerRef = useRef<HTMLDivElement | null>(null);
  const fallbackInputRef = useRef<HTMLTextAreaElement | null>(null);
  const markdownRef = useRef(markdownValue);

  useEffect(() => {
    markdownRef.current = markdownValue;
  }, [markdownValue]);

  useEffect(() => {
    let cancelled = false;
    const loadEditor = async () => {
      try {
        const [{ BlockNoteView }, { BlockNoteEditor }] = await Promise.all([import("@blocknote/mantine"), import("@blocknote/core")]);
        if (cancelled) return;
        const nextEditor = BlockNoteEditor.create() as unknown as BlockNoteRuntimeEditor;
        const preloadedMarkdown = markdownRef.current.trim();
        if (preloadedMarkdown) {
          const blocks = nextEditor.tryParseMarkdownToBlocks(preloadedMarkdown);
          nextEditor.replaceBlocks(nextEditor.document, blocks as Array<{ type: string; content?: string }>);
        }
        setBlockNoteView(() => BlockNoteView as unknown as ComponentType<BlockNoteRuntimeViewProps>);
        setEditor(nextEditor);
      } catch {
        // Keep textarea fallback available when editor runtime fails to load.
      }
    };
    void loadEditor();
    return () => {
      cancelled = true;
    };
  }, []);

  const syncEditorDraft = useCallback(() => {
    if (!editor) return;
    const markdown = editor.blocksToMarkdownLossy(editor.document).trim();
    const html = editor.blocksToHTMLLossy(editor.document);
    setMarkdownValue(markdown);
    setHtmlValue(html);
  }, [editor]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (editor) {
          editor.focus();
          return;
        }
        fallbackInputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editor]);

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

  const tags = useMemo(() => extractTags(markdownValue), [markdownValue]);
  const selectedCount = selectedGoals.length + selectedProjects.length;
  const link = useMemo(() => firstLinkFromText(markdownValue), [markdownValue]);

  const insertLink = useCallback(() => {
    const raw = window.prompt("Paste a URL to add");
    if (!raw) return;
    const normalized = normalizeHttpUrl(raw.trim());
    if (!normalized) return;
    const spacer = markdownValue && !markdownValue.endsWith(" ") && !markdownValue.endsWith("\n") ? " " : "";
    if (editor) {
      editor.insertInlineContent(`${spacer}${normalized}`);
      editor.focus();
      syncEditorDraft();
      return;
    }
    setMarkdownValue((state) => `${state}${spacer}${normalized}`);
  }, [editor, markdownValue, syncEditorDraft]);

  const submit = useCallback(() => {
    const markdown = markdownValue.trim();
    if (!markdown) return;

    const richContent = encodeBlockNoteContent({
      html: htmlValue,
      markdown,
    });
    const canSaveRich = Boolean(editor && blockNoteView);

    onAdd({
      content: isCode || !canSaveRich ? markdown : richContent || markdown,
      goals: selectedGoals,
      projects: selectedProjects,
      tags,
      isCode,
      link: firstLinkFromText(markdown),
      priority: priority ?? undefined,
      stateOfHeart: stateOfHeart ?? undefined,
    });
    if (editor) {
      editor.replaceBlocks(editor.document, [{ type: "paragraph", content: "" }]);
      editor.focus();
    }
    setMarkdownValue("");
    setHtmlValue("");
    setSelectedGoals([]);
    setSelectedProjects([]);
    setIsCode(false);
    setPriority(null);
    setStateOfHeart(null);
  }, [blockNoteView, editor, htmlValue, isCode, markdownValue, onAdd, priority, selectedGoals, selectedProjects, stateOfHeart, tags]);

  const BlockNoteRenderer = blockNoteView;
  const timePlaceholder = getTimePlaceholder();

  return (
    <div
      className={`capture ${focused ? "focused" : ""}`}
      onFocus={() => setFocused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      {BlockNoteRenderer && editor ? (
        <BlockNoteRenderer
          editor={editor}
          className="capture-editor"
          aria-label="Capture editor"
          onChange={syncEditorDraft}
          onKeyDownCapture={(event: ReactKeyboardEvent<HTMLDivElement>) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") setPicker(false);
          }}
        />
      ) : (
        <textarea
          ref={fallbackInputRef}
          className="capture-editor-fallback"
          aria-label="Capture editor"
          placeholder={timePlaceholder}
          value={markdownValue}
          onChange={(event) => setMarkdownValue(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              submit();
            }
            if (event.key === "Escape") setPicker(false);
          }}
        />
      )}

      <div className="capture-intention">
        <div className="capture-intention-label">Intention check: is this for Dunya (Immediate) or Akhirah (Legacy)?</div>
        <div className="capture-intention-toggle">
          <button
            className={priority === "dunya" ? "on" : ""}
            onClick={() => setPriority((state) => (state === "dunya" ? null : "dunya"))}
            type="button"
            aria-pressed={priority === "dunya"}
          >
            Dunya
          </button>
          <button
            className={priority === "akhirah" ? "on" : ""}
            onClick={() => setPriority((state) => (state === "akhirah" ? null : "akhirah"))}
            type="button"
            aria-pressed={priority === "akhirah"}
          >
            Akhirah
          </button>
        </div>
      </div>

      <div className="capture-heart">
        <div className="capture-intention-label">Heart state (Ḥāl):</div>
        <div className="heart-state-toggle">
          {(["open", "clear", "clouded", "contracted"] as const).map((s) => (
            <button
              key={s}
              className={stateOfHeart === s ? "on" : ""}
              onClick={() => setStateOfHeart((prev) => (prev === s ? null : s))}
              type="button"
              aria-pressed={stateOfHeart === s}
              title={s === "open" ? "Inshirāḥ — expansive" : s === "clear" ? "Ṣafā — clear" : s === "clouded" ? "Ghaflah — distracted" : "Qabd — contracted"}
            >
              {s === "open" ? "○ Inshirāḥ" : s === "clear" ? "◇ Ṣafā" : s === "clouded" ? "≈ Ghaflah" : "● Qabd"}
            </button>
          ))}
        </div>
      </div>

      {(selectedCount > 0 || tags.length > 0 || isCode || link) && (
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
          {isCode ? <span className="chip selected">Code mode on</span> : null}
          {link ? <span className="chip selected">Link ready</span> : null}
        </div>
      )}

      <div className="capture-toolbar">
        <div className="tool-left" ref={pickerRef} style={{ position: "relative" }}>
          <button className="tool-btn" title="Link to goal / project" aria-label="Link to goal / project" onClick={() => setPicker((state) => !state)} type="button">
            <Icon.Paperclip />
          </button>
          <button
            className={`tool-btn ${isCode ? "active" : ""}`}
            title="Code block" aria-label="Toggle code mode"
            onClick={() => setIsCode((state) => !state)}
            type="button"
          >
            <Icon.Code />
          </button>
          <button className={`tool-btn ${link ? "active" : ""}`} title="Insert link" type="button" onClick={insertLink}>
            <Icon.Link />
          </button>
          <button
            className="tool-btn"
            title="Insert tag"
            type="button"
            onClick={() => {
              const spacer = markdownValue.endsWith(" ") || !markdownValue ? "" : " ";
              if (editor) {
                editor.insertInlineContent(`${spacer}#`);
                editor.focus();
                syncEditorDraft();
                return;
              }
              setMarkdownValue((state) => `${state}${spacer}#`);
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
            <span className="kbd">⌘K</span> to focus - <span className="kbd">⌘↵</span> to save
          </span>
          <button className="save-btn" disabled={!markdownValue.trim()} onClick={submit} type="button">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

interface FeedViewProps {
  activeGreeting: string;
  greetingName?: string;
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
  onTogglePromote: (entryId: string) => void;
  onMarkPivot: (entryId: string) => void;
  akhirahLens?: boolean;
}

export function FeedView({
  activeGreeting,
  greetingName,
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
  onTogglePromote,
  onMarkPivot,
  akhirahLens,
}: FeedViewProps) {
  const trimmedGreetingName = greetingName?.trim();
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
        {trimmedGreetingName ? `${activeGreeting}, ${trimmedGreetingName}. ` : `${activeGreeting}. `}
        <em>What's worth keeping?</em>
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
                <Entry
                  key={entry.id}
                  entry={entry}
                  goals={goals}
                  projects={projects}
                  onStar={onToggleStar}
                  onPromote={onTogglePromote}
                  onMarkPivot={onMarkPivot}
                  onFilter={onSetContextFilter}
                  akhirahLens={akhirahLens}
                />
              ),
            )}
          </div>
        ))}
      </div>
    </main>
  );
}
