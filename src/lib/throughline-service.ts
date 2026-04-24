import { buildMinimap } from "@/lib/minimap";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { getWeekKey } from "@/lib/week-key";
import type {
  CreateGoalPayload,
  CreateCommitmentPayload,
  CreateEntryPayload,
  CreateProjectPayload,
  EntryPriority,
  GoalIntent,
  GoalStatus,
  HeartState,
  MuhasabahReport,
  MuhasabahThread,
  PatchCommitmentPayload,
  PatchEntryPayload,
  ThroughlineBootstrap,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProject,
  ThroughlineThreadsView,
  ThroughlineTimelineYear,
  ThroughlineWeekCommitment,
  UpdateGoalPayload,
  UpdateProjectPayload,
} from "@/lib/types";

const BOOTSTRAP_ENTRY_LIMIT = 60;

interface DbEntryRow {
  id: string;
  content: string;
  created_at: string;
  starred: boolean;
  archived: boolean;
  goals: string[];
  projects: string[];
  tags: string[];
  is_code: boolean;
  link: ThroughlineEntry["link"];
  signal: boolean;
  is_pivot: boolean;
  from_text: string | null;
  to_text: string | null;
  slot_kind: string | null;
  pivot_label: string | null;
  priority?: string | null;
  state_of_heart?: string | null;
}

interface DbGoalRow {
  id: string;
  name: string;
  color: string | null;
  target_date: string | null;
  active_from: string | null;
  active_to: string | null;
  order_index: number;
  status?: string | null;
  primary_intent?: string | null;
}

interface DbProjectRow {
  id: string;
  name: string;
  goal_id: string | null;
  color: string | null;
  tag: string | null;
  target_date: string | null;
  active_from: string | null;
  active_to: string | null;
  order_index: number;
  status?: string | null;
}

interface DbCommitmentRow {
  id: string;
  week_key: string;
  text: string;
  done: boolean;
  order_index: number;
  created_at: string;
}

function mapEntryRow(row: DbEntryRow): ThroughlineEntry {
  return {
    id: row.id,
    content: row.content,
    created_at: row.created_at,
    starred: row.starred,
    archived: row.archived,
    goals: row.goals ?? [],
    projects: row.projects ?? [],
    tags: row.tags ?? [],
    isCode: row.is_code,
    link: row.link,
    signal: row.signal,
    isPivot: row.is_pivot,
    from: row.from_text ?? undefined,
    to: row.to_text ?? undefined,
    slotKind: row.slot_kind ?? undefined,
    pivotLabel: row.pivot_label ?? undefined,
    priority: parsePriority(row.priority),
    stateOfHeart: parseHeartState(row.state_of_heart),
  };
}

function parsePriority(value: string | null | undefined): EntryPriority | undefined {
  if (value === "dunya" || value === "akhirah") return value;
  return undefined;
}

function parseHeartState(value: string | null | undefined): HeartState | undefined {
  if (value === "open" || value === "clear" || value === "clouded" || value === "contracted") return value;
  return undefined;
}

function parseGoalIntent(value: string | null | undefined): GoalIntent | undefined {
  if (value === "immediate" || value === "legacy") return value;
  return undefined;
}

function parseGoalStatus(value: string | null | undefined): GoalStatus | undefined {
  if (value === "active" || value === "paused" || value === "someday" || value === "archived") return value;
  return undefined;
}

function isMissingPriorityColumnError(error: { message?: string; details?: string | null; hint?: string | null; code?: string } | null) {
  if (!error) return false;
  if (error.code === "42703" || error.code?.toLowerCase() === "pgrst204") return true;
  const haystack = `${error.message ?? ""} ${error.details ?? ""} ${error.hint ?? ""}`.toLowerCase();
  return haystack.includes("priority") && haystack.includes("column");
}

function mapGoalRow(row: DbGoalRow): ThroughlineGoal {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
    target_date: row.target_date ?? undefined,
    active_from: row.active_from ?? undefined,
    active_to: row.active_to ?? undefined,
    order_index: row.order_index,
    status: parseGoalStatus(row.status) ?? "active",
    primary_intent: parseGoalIntent(row.primary_intent),
  };
}

function mapProjectRow(row: DbProjectRow): ThroughlineProject {
  return {
    id: row.id,
    name: row.name,
    goal_id: row.goal_id,
    color: row.color ?? undefined,
    tag: row.tag ?? undefined,
    target_date: row.target_date ?? undefined,
    active_from: row.active_from ?? undefined,
    active_to: row.active_to ?? undefined,
    order_index: row.order_index,
    status: parseGoalStatus(row.status) ?? "active",
  };
}

function mapCommitmentRow(row: DbCommitmentRow): ThroughlineWeekCommitment {
  return {
    id: row.id,
    week_key: row.week_key,
    text: row.text,
    done: row.done,
    order_index: row.order_index,
    created_at: row.created_at,
  };
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function toDate(value: string | undefined | null): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function clampPercent(value: number) {
  if (value <= 0) return 0;
  if (value >= 100) return 100;
  return value;
}

function positionInRange(target: Date, from: Date, to: Date) {
  const span = to.getTime() - from.getTime();
  if (span <= 0) return 0;
  return clampPercent(((target.getTime() - from.getTime()) / span) * 100);
}

function isSignal(entry: ThroughlineEntry) {
  return Boolean(entry.signal || entry.starred);
}

function getPointKind(entry: ThroughlineEntry): "capture" | "signal" | "pivot" {
  if (entry.isPivot) return "pivot";
  if (isSignal(entry)) return "signal";
  return "capture";
}

async function nextOrderIndex(table: "throughline_goals" | "throughline_projects") {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.from(table).select("order_index").order("order_index", { ascending: false }).limit(1);
  if (error) throw error;
  return ((data?.[0]?.order_index as number | undefined) ?? -1) + 1;
}

async function listGoalsProjects() {
  const supabase = getSupabaseAdmin();
  const [goalsRes, projectsRes] = await Promise.all([
    supabase.from("throughline_goals").select("*").order("order_index", { ascending: true }),
    supabase.from("throughline_projects").select("*").order("order_index", { ascending: true }),
  ]);

  if (goalsRes.error) throw goalsRes.error;
  if (projectsRes.error) throw projectsRes.error;

  return {
    goals: (goalsRes.data ?? []).map(mapGoalRow),
    projects: (projectsRes.data ?? []).map(mapProjectRow),
  };
}


export async function getBootstrapData(): Promise<ThroughlineBootstrap> {
  const supabase = getSupabaseAdmin();
  const weekKey = getWeekKey();

  const [{ goals, projects }, entriesRes, countRes, profileRes, commitmentsRes] = await Promise.all([
    listGoalsProjects(),
    supabase
      .from("throughline_entries")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(BOOTSTRAP_ENTRY_LIMIT),
    supabase.from("throughline_entries").select("id", { count: "exact", head: true }),
    supabase.from("throughline_profiles").select("*").limit(1).maybeSingle(),
    supabase
      .from("throughline_commitments")
      .select("*")
      .eq("week_key", weekKey)
      .order("order_index", { ascending: true }),
  ]);

  if (entriesRes.error) throw entriesRes.error;

  const entries = (entriesRes.data ?? []).map(mapEntryRow);
  const totalCount = countRes.count ?? 0;

  return {
    goals,
    projects,
    entries,
    minimap: buildMinimap(entries),
    profile: profileRes.data ?? null,
    commitments: (commitmentsRes.data ?? []).map(mapCommitmentRow),
    hasMoreEntries: totalCount > BOOTSTRAP_ENTRY_LIMIT,
  };
}

export async function listEntriesByTag(tag: string): Promise<ThroughlineEntry[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_entries")
    .select("*")
    .contains("tags", [tag])
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapEntryRow);
}

export async function listEntriesPage(cursor?: string): Promise<{ entries: ThroughlineEntry[]; hasMore: boolean }> {
  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("throughline_entries")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(BOOTSTRAP_ENTRY_LIMIT + 1);

  if (cursor) {
    query = query.lt("created_at", cursor);
  }

  const { data, error } = await query;
  if (error) throw error;

  const rows = data ?? [];
  const hasMore = rows.length > BOOTSTRAP_ENTRY_LIMIT;
  return {
    entries: rows.slice(0, BOOTSTRAP_ENTRY_LIMIT).map(mapEntryRow),
    hasMore,
  };
}

export async function createEntry(payload: CreateEntryPayload, userId?: string): Promise<ThroughlineEntry> {
  const tags = payload.tags ?? [];
  const record: ThroughlineEntry = {
    id: id("e"),
    content: payload.content,
    created_at: new Date().toISOString(),
    starred: false,
    archived: false,
    goals: payload.goals ?? [],
    projects: payload.projects ?? [],
    tags,
    isCode: Boolean(payload.isCode),
    link: payload.link ?? null,
    signal: Boolean(payload.signal),
    isPivot: Boolean(payload.isPivot),
    from: payload.from,
    to: payload.to,
    slotKind: payload.slotKind,
    pivotLabel: payload.pivotLabel,
    priority: parsePriority(payload.priority),
    stateOfHeart: parseHeartState(payload.stateOfHeart),
  };

  const supabase = getSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    id: record.id,
    content: record.content,
    goals: record.goals,
    projects: record.projects,
    tags: record.tags,
    is_code: record.isCode,
    link: record.link,
    signal: record.signal,
    is_pivot: record.isPivot,
    from_text: record.from,
    to_text: record.to,
    slot_kind: record.slotKind,
    pivot_label: record.pivotLabel,
    priority: record.priority,
    state_of_heart: record.stateOfHeart,
    starred: false,
    archived: false,
  };
  if (userId) insertPayload.user_id = userId;

  let { data, error } = await supabase
    .from("throughline_entries")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error && isMissingPriorityColumnError(error) && "priority" in insertPayload) {
    const { priority: _priority, ...fallbackInsertPayload } = insertPayload;
    ({ data, error } = await supabase.from("throughline_entries").insert(fallbackInsertPayload).select("*").single());
  }

  if (error) throw error;
  return mapEntryRow(data as DbEntryRow);
}

export async function patchEntry(entryId: string, patch: PatchEntryPayload, userId?: string): Promise<ThroughlineEntry | null> {
  const updatePayload: Record<string, boolean | string | null> = {};
  if (typeof patch.content === "string") updatePayload.content = patch.content;
  if (typeof patch.starred === "boolean") updatePayload.starred = patch.starred;
  if (typeof patch.archived === "boolean") updatePayload.archived = patch.archived;
  if (typeof patch.signal === "boolean") updatePayload.signal = patch.signal;
  if (typeof patch.isPivot === "boolean") updatePayload.is_pivot = patch.isPivot;
  if (typeof patch.from === "string" || patch.from === null) updatePayload.from_text = patch.from ?? null;
  if (typeof patch.to === "string" || patch.to === null) updatePayload.to_text = patch.to ?? null;
  if (typeof patch.slotKind === "string" || patch.slotKind === null) updatePayload.slot_kind = patch.slotKind ?? null;
  if (typeof patch.pivotLabel === "string" || patch.pivotLabel === null) updatePayload.pivot_label = patch.pivotLabel ?? null;
  if (patch.priority === "dunya" || patch.priority === "akhirah" || patch.priority === null) {
    updatePayload.priority = patch.priority ?? null;
  }
  if (patch.stateOfHeart === null || patch.stateOfHeart === "open" || patch.stateOfHeart === "clear" || patch.stateOfHeart === "clouded" || patch.stateOfHeart === "contracted") {
    updatePayload.state_of_heart = patch.stateOfHeart ?? null;
  }

  if (Object.keys(updatePayload).length === 0) return null;

  const supabase = getSupabaseAdmin();
  let query = supabase
    .from("throughline_entries")
    .update(updatePayload)
    .eq("id", entryId);

  // Enforce ownership at the application layer as defence-in-depth alongside RLS.
  if (userId) query = query.eq("user_id", userId);

  const { data, error } = await query.select("*").single();

  if (error) throw error;
  if (!data) return null;
  return mapEntryRow(data as DbEntryRow);
}

export async function createGoal(payload: CreateGoalPayload, userId?: string): Promise<ThroughlineGoal> {
  const orderIndex = payload.order_index ?? (await nextOrderIndex("throughline_goals"));
  const supabase = getSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    id: id("g"),
    name: payload.name,
    color: payload.color ?? null,
    target_date: payload.target_date ?? null,
    active_from: payload.active_from ?? null,
    active_to: payload.active_to ?? null,
    order_index: orderIndex,
    status: payload.status ?? "active",
  };
  if (payload.primary_intent) insertPayload.primary_intent = payload.primary_intent;
  if (userId) insertPayload.user_id = userId;

  const { data, error } = await supabase
    .from("throughline_goals")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return mapGoalRow(data as DbGoalRow);
}

export async function updateGoal(goalId: string, payload: UpdateGoalPayload): Promise<ThroughlineGoal | null> {
  const updatePayload: Record<string, string | number | null> = {};
  if (typeof payload.name === "string") updatePayload.name = payload.name;
  if (typeof payload.color === "string" || payload.color === null) updatePayload.color = payload.color ?? null;
  if (typeof payload.target_date === "string" || payload.target_date === null) updatePayload.target_date = payload.target_date ?? null;
  if (typeof payload.active_from === "string" || payload.active_from === null) updatePayload.active_from = payload.active_from ?? null;
  if (typeof payload.active_to === "string" || payload.active_to === null) updatePayload.active_to = payload.active_to ?? null;
  if (typeof payload.order_index === "number") updatePayload.order_index = payload.order_index;
  if (payload.status) updatePayload.status = payload.status;
  if (payload.primary_intent === "immediate" || payload.primary_intent === "legacy" || payload.primary_intent === null) {
    updatePayload.primary_intent = payload.primary_intent ?? null;
  }
  if (Object.keys(updatePayload).length === 0) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_goals")
    .update(updatePayload)
    .eq("id", goalId)
    .select("*")
    .single();

  if (error) throw error;
  return mapGoalRow(data as DbGoalRow);
}

export async function createProject(payload: CreateProjectPayload, userId?: string): Promise<ThroughlineProject> {
  const orderIndex = payload.order_index ?? (await nextOrderIndex("throughline_projects"));
  const supabase = getSupabaseAdmin();
  const insertPayload: Record<string, unknown> = {
    id: id("p"),
    name: payload.name,
    goal_id: payload.goal_id ?? null,
    color: payload.color ?? null,
    tag: payload.tag ?? null,
    target_date: payload.target_date ?? null,
    active_from: payload.active_from ?? null,
    active_to: payload.active_to ?? null,
    order_index: orderIndex,
    status: payload.status ?? "active",
  };
  if (userId) insertPayload.user_id = userId;

  const { data, error } = await supabase
    .from("throughline_projects")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return mapProjectRow(data as DbProjectRow);
}

export async function updateProject(projectId: string, payload: UpdateProjectPayload): Promise<ThroughlineProject | null> {
  const updatePayload: Record<string, string | number | null> = {};
  if (typeof payload.name === "string") updatePayload.name = payload.name;
  if (typeof payload.goal_id === "string" || payload.goal_id === null) updatePayload.goal_id = payload.goal_id ?? null;
  if (typeof payload.color === "string" || payload.color === null) updatePayload.color = payload.color ?? null;
  if (typeof payload.tag === "string" || payload.tag === null) updatePayload.tag = payload.tag ?? null;
  if (typeof payload.target_date === "string" || payload.target_date === null) updatePayload.target_date = payload.target_date ?? null;
  if (typeof payload.active_from === "string" || payload.active_from === null) updatePayload.active_from = payload.active_from ?? null;
  if (typeof payload.active_to === "string" || payload.active_to === null) updatePayload.active_to = payload.active_to ?? null;
  if (typeof payload.order_index === "number") updatePayload.order_index = payload.order_index;
  if (payload.status) updatePayload.status = payload.status;
  if (Object.keys(updatePayload).length === 0) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_projects")
    .update(updatePayload)
    .eq("id", projectId)
    .select("*")
    .single();

  if (error) throw error;
  return mapProjectRow(data as DbProjectRow);
}

export async function createCommitment(payload: CreateCommitmentPayload, userId?: string): Promise<ThroughlineWeekCommitment> {
  const supabase = getSupabaseAdmin();
  const { data: existing } = await supabase
    .from("throughline_commitments")
    .select("order_index")
    .eq("week_key", payload.week_key)
    .order("order_index", { ascending: false })
    .limit(1);

  const nextIndex = ((existing?.[0]?.order_index as number | undefined) ?? -1) + 1;
  const insertPayload: Record<string, unknown> = {
    id: id("c"),
    week_key: payload.week_key,
    text: payload.text,
    done: false,
    order_index: payload.order_index ?? nextIndex,
  };
  if (userId) insertPayload.user_id = userId;

  const { data, error } = await supabase
    .from("throughline_commitments")
    .insert(insertPayload)
    .select("*")
    .single();

  if (error) throw error;
  return mapCommitmentRow(data as DbCommitmentRow);
}

export async function patchCommitment(commitmentId: string, patch: PatchCommitmentPayload): Promise<ThroughlineWeekCommitment | null> {
  const updatePayload: Record<string, string | boolean | number> = {};
  if (typeof patch.text === "string") updatePayload.text = patch.text;
  if (typeof patch.done === "boolean") updatePayload.done = patch.done;
  if (typeof patch.order_index === "number") updatePayload.order_index = patch.order_index;
  if (Object.keys(updatePayload).length === 0) return null;

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_commitments")
    .update(updatePayload)
    .eq("id", commitmentId)
    .select("*")
    .single();

  if (error) throw error;
  return mapCommitmentRow(data as DbCommitmentRow);
}

export async function deleteCommitment(commitmentId: string): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase.from("throughline_commitments").delete().eq("id", commitmentId);
  if (error) throw error;
}

export async function getCommitmentsForWeek(weekKey: string): Promise<ThroughlineWeekCommitment[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_commitments")
    .select("*")
    .eq("week_key", weekKey)
    .order("order_index", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapCommitmentRow);
}

export async function syncProfileTweaks(userId: string, tweaks: Record<string, unknown>): Promise<void> {
  const supabase = getSupabaseAdmin();
  const { error } = await supabase
    .from("throughline_profiles")
    .update({ tweaks, updated_at: new Date().toISOString() })
    .eq("id", userId);
  if (error) throw error;
}

export async function getThreadsView(rawMonths = 6): Promise<ThroughlineThreadsView> {
  const months = Number.isFinite(rawMonths) ? Math.min(24, Math.max(1, Math.floor(rawMonths))) : 6;
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - months);

  const { goals, projects } = await listGoalsProjects();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_entries")
    .select("*")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;

  const entries = (data ?? []).map((row) => mapEntryRow(row as DbEntryRow));
  const entriesByGoal = new Map<string, ThroughlineEntry[]>();
  const entriesByProject = new Map<string, ThroughlineEntry[]>();

  for (const entry of entries) {
    for (const goalId of entry.goals ?? []) {
      const list = entriesByGoal.get(goalId) ?? [];
      list.push(entry);
      entriesByGoal.set(goalId, list);
    }
    for (const projectId of entry.projects ?? []) {
      const list = entriesByProject.get(projectId) ?? [];
      list.push(entry);
      entriesByProject.set(projectId, list);
    }
  }

  const goalRows = goals.map((goal) => {
    const goalEntries = entriesByGoal.get(goal.id) ?? [];
    const latestSignal = [...goalEntries].reverse().find(isSignal);
    return {
      id: goal.id,
      kind: "goal" as const,
      name: goal.name,
      color: goal.color,
      order_index: goal.order_index ?? 0,
      captures: goalEntries.filter((entry) => !entry.isPivot).length,
      signals: goalEntries.filter(isSignal).length,
      pivots: goalEntries.filter((entry) => entry.isPivot).length,
      started_at: goalEntries[0]?.created_at,
      last_at: goalEntries[goalEntries.length - 1]?.created_at,
      points: goalEntries.map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        position: positionInRange(new Date(entry.created_at), from, to),
        kind: getPointKind(entry),
      })),
      latest_signal: latestSignal
        ? {
            id: latestSignal.id,
            created_at: latestSignal.created_at,
            content: latestSignal.content,
            tags: latestSignal.tags ?? [],
            isPivot: latestSignal.isPivot,
            pivotLabel: latestSignal.pivotLabel,
          }
        : undefined,
    };
  });

  const projectRows = projects.map((project) => {
    const projectEntries = entriesByProject.get(project.id) ?? [];
    const latestSignal = [...projectEntries].reverse().find(isSignal);
    return {
      id: project.id,
      kind: "project" as const,
      parent_goal_id: project.goal_id,
      name: project.name,
      color: project.color,
      order_index: project.order_index ?? 0,
      captures: projectEntries.filter((entry) => !entry.isPivot).length,
      signals: projectEntries.filter(isSignal).length,
      pivots: projectEntries.filter((entry) => entry.isPivot).length,
      started_at: projectEntries[0]?.created_at,
      last_at: projectEntries[projectEntries.length - 1]?.created_at,
      points: projectEntries.map((entry) => ({
        id: entry.id,
        created_at: entry.created_at,
        position: positionInRange(new Date(entry.created_at), from, to),
        kind: getPointKind(entry),
      })),
      latest_signal: latestSignal
        ? {
            id: latestSignal.id,
            created_at: latestSignal.created_at,
            content: latestSignal.content,
            tags: latestSignal.tags ?? [],
            isPivot: latestSignal.isPivot,
            pivotLabel: latestSignal.pivotLabel,
          }
        : undefined,
    };
  });

  const projectsByGoal = new Map<string, typeof projectRows>();
  const standaloneProjects: typeof projectRows = [];
  for (const project of projectRows.sort((a, b) => a.order_index - b.order_index)) {
    if (project.parent_goal_id) {
      const list = projectsByGoal.get(project.parent_goal_id) ?? [];
      list.push(project);
      projectsByGoal.set(project.parent_goal_id, list);
    } else {
      standaloneProjects.push(project);
    }
  }

  const orderedRows = goals
    .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
    .flatMap((goal) => [
      goalRows.find((r) => r.id === goal.id)!,
      ...(projectsByGoal.get(goal.id) ?? []),
    ])
    .filter(Boolean);
  orderedRows.push(...standaloneProjects);

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    months,
    rows: orderedRows,
  };
}

export async function getTimelineView(rawYear: number): Promise<ThroughlineTimelineYear> {
  const currentYear = new Date().getUTCFullYear();
  const year = Number.isFinite(rawYear) ? Math.min(2100, Math.max(2000, Math.floor(rawYear))) : currentYear;
  const startOfYear = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
  const endOfYear = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
  const startNextYear = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
  const msWeek = 1000 * 60 * 60 * 24 * 7;

  const { goals, projects } = await listGoalsProjects();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_entries")
    .select("*")
    .gte("created_at", startOfYear.toISOString())
    .lt("created_at", startNextYear.toISOString())
    .order("created_at", { ascending: true });
  if (error) throw error;

  const entries = (data ?? []).map((row) => mapEntryRow(row as DbEntryRow));
  const weeks = Array.from({ length: 52 }, (_, index) => {
    const start = new Date(startOfYear.getTime() + index * msWeek);
    const end = new Date(Math.min(start.getTime() + msWeek - 1, endOfYear.getTime()));
    return { week: index + 1, start: start.toISOString(), end: end.toISOString(), captures: 0, signals: 0, pivots: 0 };
  });

  for (const entry of entries) {
    const idx = Math.min(51, Math.max(0, Math.floor((new Date(entry.created_at).getTime() - startOfYear.getTime()) / msWeek)));
    if (!entry.isPivot) weeks[idx].captures += 1;
    if (isSignal(entry)) weeks[idx].signals += 1;
    if (entry.isPivot) weeks[idx].pivots += 1;
  }

  const pivots = entries
    .filter((entry) => entry.isPivot)
    .map((entry) => ({
      id: entry.id,
      created_at: entry.created_at,
      position: positionInRange(new Date(entry.created_at), startOfYear, endOfYear),
      label: entry.pivotLabel || entry.to || entry.slotKind || "Pivot",
    }));

  const entriesByGoal = new Map<string, ThroughlineEntry[]>();
  const entriesByProject = new Map<string, ThroughlineEntry[]>();
  for (const entry of entries) {
    for (const goalId of entry.goals ?? []) {
      const list = entriesByGoal.get(goalId) ?? [];
      list.push(entry);
      entriesByGoal.set(goalId, list);
    }
    for (const projectId of entry.projects ?? []) {
      const list = entriesByProject.get(projectId) ?? [];
      list.push(entry);
      entriesByProject.set(projectId, list);
    }
  }

  const clipDate = (value: Date) => {
    if (value.getTime() < startOfYear.getTime()) return startOfYear;
    if (value.getTime() > endOfYear.getTime()) return endOfYear;
    return value;
  };

  const ribbons = [
    ...goals.map((goal) => {
      const related = entriesByGoal.get(goal.id) ?? [];
      const fallbackStart = toDate(goal.active_from) ?? toDate(goal.target_date) ?? toDate(related[0]?.created_at) ?? startOfYear;
      const fallbackEnd =
        toDate(goal.active_to) ??
        toDate(related[related.length - 1]?.created_at) ??
        (year === currentYear ? new Date() : endOfYear);
      const start = clipDate(fallbackStart);
      const end = clipDate(fallbackEnd.getTime() < start.getTime() ? start : fallbackEnd);
      return {
        id: goal.id,
        kind: "goal" as const,
        label: goal.name,
        color: goal.color,
        start: start.toISOString(),
        end: end.toISOString(),
        startPosition: positionInRange(start, startOfYear, endOfYear),
        endPosition: positionInRange(end, startOfYear, endOfYear),
      };
    }),
    ...projects.map((project) => {
      const related = entriesByProject.get(project.id) ?? [];
      const parent = project.goal_id ? goals.find((goal) => goal.id === project.goal_id) : undefined;
      const fallbackStart = toDate(project.active_from) ?? toDate(project.target_date) ?? toDate(related[0]?.created_at) ?? startOfYear;
      const fallbackEnd =
        toDate(project.active_to) ??
        toDate(related[related.length - 1]?.created_at) ??
        (year === currentYear ? new Date() : endOfYear);
      const start = clipDate(fallbackStart);
      const end = clipDate(fallbackEnd.getTime() < start.getTime() ? start : fallbackEnd);
      return {
        id: project.id,
        kind: "project" as const,
        parent_goal_id: project.goal_id,
        label: project.name,
        color: project.color ?? parent?.color,
        start: start.toISOString(),
        end: end.toISOString(),
        startPosition: positionInRange(start, startOfYear, endOfYear),
        endPosition: positionInRange(end, startOfYear, endOfYear),
      };
    }),
  ];

  const now = new Date();
  const nowWeek =
    now.getUTCFullYear() === year
      ? Math.min(52, Math.max(1, Math.floor((now.getTime() - startOfYear.getTime()) / msWeek) + 1))
      : 0;

  return { year, nowWeek, weeks, pivots, ribbons };
}

export async function getMuhasabahReport(rawMonths = 1): Promise<MuhasabahReport> {
  const months = Math.min(6, Math.max(1, Math.floor(rawMonths)));
  const to = new Date();
  const from = new Date(to);
  from.setMonth(from.getMonth() - months);

  const { goals, projects } = await listGoalsProjects();
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_entries")
    .select("*")
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString())
    .or("starred.eq.true,signal.eq.true,is_pivot.eq.true")
    .order("created_at", { ascending: false });
  if (error) throw error;

  const entries = (data ?? []).map((row) => mapEntryRow(row as DbEntryRow));

  const toSignalItem = (entry: ThroughlineEntry) => ({
    id: entry.id,
    created_at: entry.created_at,
    content: entry.content,
    isPivot: entry.isPivot,
    pivotLabel: entry.pivotLabel,
    priority: entry.priority,
    tags: entry.tags ?? [],
  });

  const heartStateCounts: Record<HeartState, number> = {
    open: 0,
    clear: 0,
    clouded: 0,
    contracted: 0,
  };

  for (const entry of entries) {
    if (entry.stateOfHeart) {
      heartStateCounts[entry.stateOfHeart]++;
    }
  }

  // Build O(entries) index maps to avoid O(goals × entries) + O(projects × entries) filter loops.
  const goalEntryMap = new Map<string, ThroughlineEntry[]>();
  const projectEntryMap = new Map<string, ThroughlineEntry[]>();
  for (const entry of entries) {
    for (const gId of (entry.goals ?? [])) {
      const list = goalEntryMap.get(gId);
      if (list) list.push(entry); else goalEntryMap.set(gId, [entry]);
    }
    for (const pId of (entry.projects ?? [])) {
      const list = projectEntryMap.get(pId);
      if (list) list.push(entry); else projectEntryMap.set(pId, [entry]);
    }
  }

  const goalThreads: MuhasabahThread[] = goals.map((goal) => {
    const goalEntries = goalEntryMap.get(goal.id) ?? [];
    const signals = goalEntries.filter((e) => isSignal(e) && !e.isPivot).map(toSignalItem);
    const pivots = goalEntries.filter((e) => e.isPivot).map(toSignalItem);
    const akhirahCount = [...signals, ...pivots].filter((item) => item.priority === "akhirah").length;
    const dunyaCount = [...signals, ...pivots].filter((item) => item.priority === "dunya").length;
    return { id: goal.id, kind: "goal" as const, name: goal.name, color: goal.color, primary_intent: goal.primary_intent, signals, pivots, akhirahCount, dunyaCount };
  });

  const projectThreads: MuhasabahThread[] = projects.map((project) => {
    const projectEntries = projectEntryMap.get(project.id) ?? [];
    const signals = projectEntries.filter((e) => isSignal(e) && !e.isPivot).map(toSignalItem);
    const pivots = projectEntries.filter((e) => e.isPivot).map(toSignalItem);
    const akhirahCount = [...signals, ...pivots].filter((item) => item.priority === "akhirah").length;
    const dunyaCount = [...signals, ...pivots].filter((item) => item.priority === "dunya").length;
    return { id: project.id, kind: "project" as const, name: project.name, color: project.color, signals, pivots, akhirahCount, dunyaCount };
  });

  const threads = [...goalThreads, ...projectThreads].filter((t) => t.signals.length > 0 || t.pivots.length > 0);
  const totalSignals = threads.reduce((sum, t) => sum + t.signals.length, 0);
  const totalPivots = threads.reduce((sum, t) => sum + t.pivots.length, 0);
  const totalAkhirah = threads.reduce((sum, t) => sum + t.akhirahCount, 0);
  const total = totalSignals + totalPivots;

  return {
    from: from.toISOString(),
    to: to.toISOString(),
    months,
    threads,
    totalSignals,
    totalPivots,
    akhirahFraction: total > 0 ? totalAkhirah / total : 0,
    heartStateCounts,
  };
}
