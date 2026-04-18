export type ThemeMode = "light" | "dark";
export type LayoutMode = "top" | "sidebar";
export type DensityMode = "airy" | "balanced" | "dense";
export type EntryStyle = "journal" | "card" | "line";
export type FontPairing = "editorial" | "sans" | "serif";
export type AccentName = "indigo" | "clay" | "moss" | "ink" | "rose";
export type MainView = "feed" | "threads" | "map";
export type FeedFilter = "all" | "starred" | "links" | "code";
export type ContextFilterType = "goal" | "project" | "tag";
export type ThreadKind = "goal" | "project";
export type EntryPriority = "dunya" | "akhirah";

export interface ThroughlineLink {
  title: string;
  desc: string;
  url: string;
}

export interface ThroughlineGoal {
  id: string;
  name: string;
  color?: string;
  target_date?: string;
  active_from?: string;
  active_to?: string;
  order_index?: number;
}

export interface ThroughlineProject {
  id: string;
  name: string;
  goal_id?: string | null;
  color?: string;
  tag?: string;
  target_date?: string;
  active_from?: string;
  active_to?: string;
  order_index?: number;
}

export interface ThroughlineEntry {
  id: string;
  content: string;
  created_at: string;
  starred?: boolean;
  archived?: boolean;
  goals?: string[];
  projects?: string[];
  tags?: string[];
  isCode?: boolean;
  link?: ThroughlineLink | null;
  signal?: boolean;
  isPivot?: boolean;
  from?: string;
  to?: string;
  slotKind?: string;
  pivotLabel?: string;
  priority?: EntryPriority;
}

export interface MinimapWeek {
  week: string;
  level: 0 | 1 | 2 | 3;
  pivot?: boolean;
  captures?: number;
  signals?: number;
}

export interface ThroughlineTweaks {
  theme: ThemeMode;
  accent: AccentName;
  layout: LayoutMode;
  density: DensityMode;
  entry: EntryStyle;
  font: FontPairing;
}

export interface ThroughlineBootstrap {
  goals: ThroughlineGoal[];
  projects: ThroughlineProject[];
  entries: ThroughlineEntry[];
  minimap: MinimapWeek[];
}

export interface ThroughlineContextFilter {
  type: ContextFilterType;
  id: string;
  label: string;
}

export interface CreateEntryPayload {
  content: string;
  goals?: string[];
  projects?: string[];
  tags?: string[];
  isCode?: boolean;
  signal?: boolean;
  isPivot?: boolean;
  from?: string;
  to?: string;
  slotKind?: string;
  pivotLabel?: string;
  priority?: EntryPriority;
}

export interface PatchEntryPayload {
  starred?: boolean;
  archived?: boolean;
  signal?: boolean;
  isPivot?: boolean;
  from?: string | null;
  to?: string | null;
  slotKind?: string | null;
  pivotLabel?: string | null;
  priority?: EntryPriority | null;
}

export interface CreateGoalPayload {
  name: string;
  color?: string;
  target_date?: string;
  active_from?: string;
  active_to?: string;
  order_index?: number;
}

export interface UpdateGoalPayload extends Partial<CreateGoalPayload> {}

export interface CreateProjectPayload {
  name: string;
  goal_id?: string | null;
  color?: string;
  tag?: string;
  target_date?: string;
  active_from?: string;
  active_to?: string;
  order_index?: number;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {}

export interface ThroughlineSignalItem {
  id: string;
  created_at: string;
  content: string;
  tags: string[];
  isPivot?: boolean;
  pivotLabel?: string;
}

export interface ThroughlineThreadPoint {
  id: string;
  created_at: string;
  position: number;
  kind: "capture" | "signal" | "pivot";
}

export interface ThroughlineThreadRow {
  id: string;
  kind: ThreadKind;
  parent_goal_id?: string | null;
  name: string;
  color?: string;
  order_index: number;
  captures: number;
  signals: number;
  pivots: number;
  started_at?: string;
  last_at?: string;
  points: ThroughlineThreadPoint[];
  latest_signal?: ThroughlineSignalItem;
}

export interface ThroughlineThreadsView {
  from: string;
  to: string;
  months: number;
  rows: ThroughlineThreadRow[];
}

export interface ThroughlineTimelineWeek {
  week: number;
  start: string;
  end: string;
  captures: number;
  signals: number;
  pivots: number;
}

export interface ThroughlineTimelinePivot {
  id: string;
  created_at: string;
  position: number;
  label: string;
}

export interface ThroughlineTimelineRibbon {
  id: string;
  kind: ThreadKind;
  parent_goal_id?: string | null;
  label: string;
  color?: string;
  start: string;
  end: string;
  startPosition: number;
  endPosition: number;
}

export interface ThroughlineTimelineYear {
  year: number;
  nowWeek: number;
  weeks: ThroughlineTimelineWeek[];
  pivots: ThroughlineTimelinePivot[];
  ribbons: ThroughlineTimelineRibbon[];
}
