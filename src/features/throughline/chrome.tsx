import { Icon } from "@/features/throughline/shared";
import type {
  MainView,
  MinimapWeek,
  ThroughlineContextFilter,
  ThroughlineGoal,
  ThroughlineProject,
  ThroughlineTweaks,
} from "@/lib/types";

const GOAL_SLOTS = 3;
const PROJECT_SLOTS = 2;

export function Masthead({
  onOpenTweaks,
  onView,
  view,
  userEmail,
  onSignOut,
}: {
  onOpenTweaks: () => void;
  onView: (next: MainView) => void;
  view: MainView;
  userEmail?: string;
  onSignOut: () => void;
}) {
  const initials = (userEmail ?? "U").slice(0, 2).toUpperCase();
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
        <button className="me" type="button" onClick={onSignOut} title="Sign out">
          <span>{userEmail ?? "Sign out"}</span>
          <div className="avatar">{initials}</div>
        </button>
      </div>
    </header>
  );
}

export function BigLineBar({
  goals,
  projects,
  onSlotClick,
  onEditSlot,
  onCreateSlot,
  onStartReview,
  activeFilter,
}: {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onSlotClick: (type: "goal" | "project", id: string) => void;
  onEditSlot: (type: "goal" | "project", id: string) => void;
  onCreateSlot: (type: "goal" | "project") => void;
  onStartReview: () => void;
  activeFilter: ThroughlineContextFilter | null;
}) {
  const goalPlaceholders = Math.max(0, GOAL_SLOTS - goals.length);
  const projectPlaceholders = Math.max(0, PROJECT_SLOTS - projects.length);

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
                <button
                  className="slot-edit"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditSlot("goal", goal.id);
                  }}
                  type="button"
                >
                  Edit
                </button>
              </div>
            ))}
            {Array.from({ length: goalPlaceholders }).map((_, index) => (
              <button key={`goal-empty-${index}`} className="slot empty" onClick={() => onCreateSlot("goal")} type="button">
                <div className="slot-kind">Open slot</div>
                <div className="slot-text">+ New life goal</div>
              </button>
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
                <button
                  className="slot-edit"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEditSlot("project", project.id);
                  }}
                  type="button"
                >
                  Edit
                </button>
              </div>
            ))}
            {Array.from({ length: projectPlaceholders }).map((_, index) => (
              <button key={`project-empty-${index}`} className="slot empty" onClick={() => onCreateSlot("project")} type="button">
                <div className="slot-kind">Open slot</div>
                <div className="slot-text">+ New project</div>
              </button>
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

export function Sidebar({
  goals,
  projects,
  onSlotClick,
  onCreate,
  onEdit,
  activeFilter,
  onStartReview,
}: {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  onSlotClick: (type: "goal" | "project", id: string) => void;
  onCreate: (type: "goal" | "project") => void;
  onEdit: (type: "goal" | "project", id: string) => void;
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
            <button
              className="item-edit"
              onClick={(event) => {
                event.stopPropagation();
                onEdit("goal", goal.id);
              }}
              type="button"
            >
              Edit
            </button>
          </div>
        ))}
        <button className="inline-create" onClick={() => onCreate("goal")} type="button">
          + New life goal
        </button>
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
            <button
              className="item-edit"
              onClick={(event) => {
                event.stopPropagation();
                onEdit("project", project.id);
              }}
              type="button"
            >
              Edit
            </button>
          </div>
        ))}
        <button className="inline-create" onClick={() => onCreate("project")} type="button">
          + New project
        </button>
      </div>
      <div style={{ marginTop: "auto" }}>
        <button className="review-btn" style={{ width: "100%" }} onClick={onStartReview} type="button">
          Weekly review
        </button>
      </div>
    </aside>
  );
}

export function Minimap({ data }: { data: MinimapWeek[] }) {
  return (
    <div className="minimap">
      <div className="title">8 wks - scroll back</div>
      {data.map((week, index) => (
        <div
          key={`${week.week}-${index}`}
          className="wk"
          title={`${week.captures ?? 0} captures · ${week.signals ?? 0} signals${
            week.level === 3 && (week.signals ?? 0) === 0 && !week.pivot ? " · Busy-work risk" : ""
          }`}
        >
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

export function TweaksPanel({
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
