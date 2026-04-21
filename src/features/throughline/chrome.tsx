import type {
  GoalStatus,
  MainView,
  MinimapWeek,
  ThroughlineContextFilter,
  ThroughlineGoal,
  ThroughlineProject,
} from "@/lib/types";

function StatusDot({ status }: { status: GoalStatus }) {
  if (status === "active") return null;
  return <span className={`status-dot ${status}`} aria-label={status} />;
}

function initialsFor(source: string): string {
  return source
    .split(/\s+/)
    .filter(Boolean)
    .map((chunk) => chunk[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

interface NavItem {
  id: MainView | "review-weekly";
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: readonly NavItem[] = [
  {
    id: "feed",
    label: "Feed",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2.5 4h11M2.5 8h11M2.5 12h7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "threads",
    label: "Threads",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M3 3c0 4 10 4 10 8 0 1.5-1 2.5-2.5 2.5M3 10c0-3 7-3 7-6 0-1-.7-1.5-1.5-1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Timeline",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M2 12h12M4 12V7M8 12V4M12 12V8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "review",
    label: "Review",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M5 3h5l3 3v7a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" strokeLinejoin="round" />
        <path d="M10 3v3h3M6 9h4M6 11h4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "review-weekly",
    label: "Weekly review",
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="8" cy="8" r="6" />
        <path d="M8 5v3l2 1.5" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export interface LeftSidebarProps {
  view: MainView;
  onView: (next: MainView) => void;
  onStartReview: () => void;
  userLabel?: string;
  userEmail?: string;
  onOpenProfileSettings: () => void;
}

export function LeftSidebar({ view, onView, onStartReview, userLabel, userEmail, onOpenProfileSettings }: LeftSidebarProps) {
  const displayName = userLabel?.trim() || userEmail?.trim() || "Profile";
  const initials = initialsFor(displayName);

  const handleNav = (item: NavItem) => {
    if (item.id === "review-weekly") {
      onStartReview();
      return;
    }
    onView(item.id);
  };

  return (
    <aside className="left-sidebar" aria-label="Primary navigation">
      <div className="brand">
        <div className="brand-mark">T</div>
        <div className="brand-name">
          Through<em>line</em>
        </div>
      </div>

      <nav className="nav-list">
        {NAV_ITEMS.map((item) => {
          const active = item.id !== "review-weekly" && view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              className={`nav-item${active ? " active" : ""}`}
              onClick={() => handleNav(item)}
              aria-current={active ? "page" : undefined}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-spacer" />

      <button type="button" className="profile-row" onClick={onOpenProfileSettings} aria-label="Open profile settings">
        <div className="profile-avatar">{initials}</div>
        <div className="profile-meta">
          <div className="profile-name">{userLabel ?? displayName}</div>
          {userEmail ? <div className="profile-email">{userEmail}</div> : null}
        </div>
      </button>
    </aside>
  );
}

export interface RightSidebarProps {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  activeFilter: ThroughlineContextFilter | null;
  onSlotClick: (type: "goal" | "project", id: string) => void;
  onCreate: (type: "goal" | "project") => void;
  onEdit: (type: "goal" | "project", id: string) => void;
}

export function RightSidebar({ goals, projects, activeFilter, onSlotClick, onCreate, onEdit }: RightSidebarProps) {
  return (
    <aside className="right-sidebar" aria-label="Goals and projects">
      <section className="side-section">
        <h3 className="side-heading">Life goals</h3>
        <div className="side-items">
          {goals.map((goal, index) => {
            const active = activeFilter?.type === "goal" && activeFilter.id === goal.id;
            return (
              <div
                key={goal.id}
                className={`side-item${active ? " active" : ""}${goal.status === "archived" ? " archived" : ""}`}
                style={goal.color ? ({ "--slot-color": goal.color } as React.CSSProperties) : undefined}
                onClick={() => onSlotClick("goal", goal.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSlotClick("goal", goal.id);
                  }
                }}
              >
                <span className="side-kind">Goal 0{index + 1}</span>
                <span className="side-name">
                  {goal.name}
                  {goal.primary_intent === "legacy" && (
                    <span className="intent-moon" aria-label="Akhirah goal" title="Akhirah · Legacy intent">
                      ☽
                    </span>
                  )}
                  {goal.status && goal.status !== "active" && <StatusDot status={goal.status} />}
                </span>
                <button
                  className="side-edit"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit("goal", goal.id);
                  }}
                  type="button"
                >
                  Edit
                </button>
              </div>
            );
          })}
          <button className="side-create" onClick={() => onCreate("goal")} type="button">
            + New life goal
          </button>
        </div>
      </section>

      <section className="side-section">
        <h3 className="side-heading">Projects</h3>
        <div className="side-items">
          {projects.map((project, index) => {
            const active = activeFilter?.type === "project" && activeFilter.id === project.id;
            return (
              <div
                key={project.id}
                className={`side-item${active ? " active" : ""}${project.status === "archived" ? " archived" : ""}`}
                style={project.color ? ({ "--slot-color": project.color } as React.CSSProperties) : undefined}
                onClick={() => onSlotClick("project", project.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSlotClick("project", project.id);
                  }
                }}
              >
                <span className="side-kind">Project 0{index + 1}</span>
                <span className="side-name">
                  {project.name}
                  {project.status && project.status !== "active" && <StatusDot status={project.status} />}
                </span>
                <button
                  className="side-edit"
                  onClick={(event) => {
                    event.stopPropagation();
                    onEdit("project", project.id);
                  }}
                  type="button"
                >
                  Edit
                </button>
              </div>
            );
          })}
          <button className="side-create" onClick={() => onCreate("project")} type="button">
            + New project
          </button>
        </div>
      </section>
    </aside>
  );
}

export function Minimap({ data }: { data: MinimapWeek[] }) {
  // Intentionally hidden via CSS — kept for future use.
  return (
    <div className="minimap" aria-hidden="true">
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
