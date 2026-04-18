import { buildMinimap } from "@/lib/minimap";
import { SEED_ENTRIES, SEED_GOALS, SEED_MINIMAP, SEED_PROJECTS } from "@/lib/seed";
import { getSupabaseAdmin, hasSupabaseConfig } from "@/lib/supabase-admin";
import type {
  CreateEntryPayload,
  ThroughlineBootstrap,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProject,
} from "@/lib/types";

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
  is_pivot: boolean;
  from_text: string | null;
  to_text: string | null;
  slot_kind: string | null;
}

interface DbGoalRow {
  id: string;
  name: string;
  color: string | null;
  order_index: number;
}

interface DbProjectRow {
  id: string;
  name: string;
  tag: string | null;
  order_index: number;
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
    isPivot: row.is_pivot,
    from: row.from_text ?? undefined,
    to: row.to_text ?? undefined,
    slotKind: row.slot_kind ?? undefined,
  };
}

function mapGoalRow(row: DbGoalRow): ThroughlineGoal {
  return {
    id: row.id,
    name: row.name,
    color: row.color ?? undefined,
    order_index: row.order_index,
  };
}

function mapProjectRow(row: DbProjectRow): ThroughlineProject {
  return {
    id: row.id,
    name: row.name,
    tag: row.tag ?? undefined,
    order_index: row.order_index,
  };
}

function id(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function getBootstrapData(): Promise<ThroughlineBootstrap> {
  if (!hasSupabaseConfig()) {
    return {
      goals: SEED_GOALS,
      projects: SEED_PROJECTS,
      entries: SEED_ENTRIES,
      minimap: SEED_MINIMAP,
    };
  }

  const supabase = getSupabaseAdmin();
  const [goalsRes, projectsRes, entriesRes] = await Promise.all([
    supabase.from("throughline_goals").select("*").order("order_index", { ascending: true }),
    supabase.from("throughline_projects").select("*").order("order_index", { ascending: true }),
    supabase.from("throughline_entries").select("*").order("created_at", { ascending: false }),
  ]);

  if (goalsRes.error) throw goalsRes.error;
  if (projectsRes.error) throw projectsRes.error;
  if (entriesRes.error) throw entriesRes.error;

  const goals = (goalsRes.data ?? []).map(mapGoalRow);
  const projects = (projectsRes.data ?? []).map(mapProjectRow);
  const entries = (entriesRes.data ?? []).map(mapEntryRow);

  return {
    goals,
    projects,
    entries,
    minimap: buildMinimap(entries),
  };
}

export async function createEntry(payload: CreateEntryPayload): Promise<ThroughlineEntry> {
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
  };

  if (!hasSupabaseConfig()) {
    return record;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_entries")
    .insert({
      id: record.id,
      content: record.content,
      goals: record.goals,
      projects: record.projects,
      tags: record.tags,
      is_code: record.isCode,
      starred: false,
      archived: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapEntryRow(data as DbEntryRow);
}

export async function patchEntry(
  entryId: string,
  patch: Partial<Pick<ThroughlineEntry, "starred" | "archived">>,
): Promise<ThroughlineEntry | null> {
  if (!hasSupabaseConfig()) {
    return null;
  }

  const updatePayload: Record<string, boolean> = {};
  if (typeof patch.starred === "boolean") updatePayload.starred = patch.starred;
  if (typeof patch.archived === "boolean") updatePayload.archived = patch.archived;

  if (Object.keys(updatePayload).length === 0) {
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("throughline_entries")
    .update(updatePayload)
    .eq("id", entryId)
    .select("*")
    .single();

  if (error) throw error;
  return mapEntryRow(data as DbEntryRow);
}

export async function ensureSeedData() {
  if (!hasSupabaseConfig()) return;

  const supabase = getSupabaseAdmin();

  const goalCount = await supabase.from("throughline_goals").select("id", { count: "exact", head: true });
  if (goalCount.error) throw goalCount.error;
  if ((goalCount.count ?? 0) > 0) return;

  const goalsRows = SEED_GOALS.map((goal, index) => ({
    id: goal.id,
    name: goal.name,
    color: goal.color ?? null,
    order_index: goal.order_index ?? index,
  }));
  const projectRows = SEED_PROJECTS.map((project, index) => ({
    id: project.id,
    name: project.name,
    tag: project.tag ?? null,
    order_index: project.order_index ?? index,
  }));
  const entryRows = SEED_ENTRIES.map((entry) => ({
    id: entry.id,
    content: entry.content,
    created_at: entry.created_at,
    starred: Boolean(entry.starred),
    archived: Boolean(entry.archived),
    goals: entry.goals ?? [],
    projects: entry.projects ?? [],
    tags: entry.tags ?? [],
    is_code: Boolean(entry.isCode),
    link: entry.link ?? null,
    is_pivot: Boolean(entry.isPivot),
    from_text: entry.from ?? null,
    to_text: entry.to ?? null,
    slot_kind: entry.slotKind ?? null,
  }));

  const [insertGoals, insertProjects, insertEntries] = await Promise.all([
    supabase.from("throughline_goals").insert(goalsRows),
    supabase.from("throughline_projects").insert(projectRows),
    supabase.from("throughline_entries").insert(entryRows),
  ]);

  if (insertGoals.error) throw insertGoals.error;
  if (insertProjects.error) throw insertProjects.error;
  if (insertEntries.error) throw insertEntries.error;
}
