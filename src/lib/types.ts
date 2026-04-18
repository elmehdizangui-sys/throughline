export type ThemeMode = "light" | "dark";
export type LayoutMode = "top" | "sidebar";
export type DensityMode = "airy" | "balanced" | "dense";
export type EntryStyle = "journal" | "card" | "line";
export type FontPairing = "editorial" | "sans" | "serif";
export type AccentName = "indigo" | "clay" | "moss" | "ink" | "rose";
export type MainView = "feed" | "threads" | "map";
export type FeedFilter = "all" | "starred" | "links" | "code";
export type ContextFilterType = "goal" | "project" | "tag";

export interface ThroughlineLink {
  title: string;
  desc: string;
  url: string;
}

export interface ThroughlineGoal {
  id: string;
  name: string;
  color?: string;
  order_index?: number;
}

export interface ThroughlineProject {
  id: string;
  name: string;
  tag?: string;
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
  isPivot?: boolean;
  from?: string;
  to?: string;
  slotKind?: string;
}

export interface MinimapWeek {
  week: string;
  level: 0 | 1 | 2 | 3;
  pivot?: boolean;
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
}
