"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { DEFAULT_TWEAKS } from "@/lib/seed";
import { buildMinimap } from "@/lib/minimap";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import type {
  CreateEntryPayload,
  FeedFilter,
  MainView,
  MinimapWeek,
  ThroughlineBootstrap,
  ThroughlineContextFilter,
  ThroughlineEntry,
  ThroughlineGoal,
  ThroughlineProfile,
  ThroughlineProject,
  ThroughlineThreadsView,
  ThroughlineTimelineYear,
  ThroughlineTweaks,
} from "@/lib/types";
import { BigLineBar, Masthead, Minimap, Sidebar, TweaksPanel } from "@/features/throughline/chrome";
import { FeedView } from "@/features/throughline/feed";
import { applyTweaks, formatDay, Icon } from "@/features/throughline/shared";
import { ThreadsView } from "@/features/throughline/threads-view";
import { TimelineView } from "@/features/throughline/timeline-view";
import { WeeklyReview } from "@/features/throughline/weekly-review";
import { GoalProjectComposer, type ComposerSubmitPayload } from "@/features/throughline/goal-project-composer";
import { ProfileSettings, type ProfileSettingsFormValues } from "@/features/throughline/profile-settings";

function currentYear() {
  return new Date().getUTCFullYear();
}

function clampYear(year: number) {
  return Math.max(2000, Math.min(2100, year));
}

export function ThroughlineHomePage() {
  const [goals, setGoals] = useState<ThroughlineGoal[]>([]);
  const [projects, setProjects] = useState<ThroughlineProject[]>([]);
  const [entries, setEntries] = useState<ThroughlineEntry[]>([]);

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

  const [threadsData, setThreadsData] = useState<ThroughlineThreadsView | null>(null);
  const [threadsLoading, setThreadsLoading] = useState(false);

  const [timelineYear, setTimelineYear] = useState<number>(() => currentYear());
  const [timelineData, setTimelineData] = useState<ThroughlineTimelineYear | null>(null);
  const [timelineLoading, setTimelineLoading] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerKind, setComposerKind] = useState<"goal" | "project">("goal");
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | undefined>(undefined);
  const [authResolved, setAuthResolved] = useState(false);
  const [profile, setProfile] = useState<ThroughlineProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileSaveError, setProfileSaveError] = useState<string | null>(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [composerPreselectedGoalId, setComposerPreselectedGoalId] = useState<string | null>(null);

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

  const loadProfile = useCallback(async (nextUserId: string, nextUserEmail?: string | null) => {
    const supabase = getSupabaseBrowserClient();
    const { data, error } = await supabase
      .from("throughline_profiles")
      .select("id, email, display_name, bio, created_at, updated_at")
      .eq("id", nextUserId)
      .maybeSingle();

    if (error) {
      console.error("Failed to load profile", error);
      setProfile((state) => state ?? { id: nextUserId, email: nextUserEmail ?? null, display_name: "", bio: "" });
      return;
    }

    if (!data) {
      setProfile({ id: nextUserId, email: nextUserEmail ?? null, display_name: "", bio: "" });
      return;
    }

    setProfile(data as ThroughlineProfile);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();
    const applyUser = (nextUser: { id: string; email?: string | null } | null) => {
      if (cancelled) return;
      if (!nextUser) {
        setUserId(null);
        setUserEmail(undefined);
        setProfile(null);
        setAuthResolved(true);
        return;
      }
      setUserId(nextUser.id);
      setUserEmail(nextUser.email ?? undefined);
      setAuthResolved(true);
      void loadProfile(nextUser.id, nextUser.email);
    };

    void supabase.auth
      .getUser()
      .then(({ data }) => {
        applyUser(data.user ?? null);
      })
      .catch(() => {
        if (!cancelled) {
          setAuthResolved(true);
        }
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyUser(session?.user ?? null);
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const response = await fetch("/api/bootstrap", { method: "GET", cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ThroughlineBootstrap;
        if (!cancelled) {
          setGoals(data.goals);
          setProjects(data.projects);
          setEntries(data.entries);
        }
      } catch {
        // Silent fallback to current state.
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (view !== "threads") return;
    let cancelled = false;

    const loadThreads = async () => {
      setThreadsLoading(true);
      try {
        const response = await fetch("/api/threads?months=6", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ThroughlineThreadsView;
        if (!cancelled) {
          setThreadsData(data);
        }
      } catch {
        // Ignore and keep previous data.
      } finally {
        if (!cancelled) setThreadsLoading(false);
      }
    };

    void loadThreads();
    return () => {
      cancelled = true;
    };
  }, [view, entries, goals, projects]);

  useEffect(() => {
    if (view !== "map") return;
    let cancelled = false;

    const loadTimeline = async () => {
      setTimelineLoading(true);
      try {
        const response = await fetch(`/api/timeline?year=${timelineYear}`, { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as ThroughlineTimelineYear;
        if (!cancelled) {
          setTimelineData(data);
        }
      } catch {
        // Ignore and keep previous data.
      } finally {
        if (!cancelled) setTimelineLoading(false);
      }
    };

    void loadTimeline();
    return () => {
      cancelled = true;
    };
  }, [view, timelineYear, entries, goals, projects]);

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
      // Keep UI responsive; no throw.
    }
  }, []);

  const toggleStar = useCallback(
    async (id: string) => {
      const current = entries.find((entry) => entry.id === id);
      if (!current) return;

      const nextStarred = !Boolean(current.starred);
      setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, starred: nextStarred } : entry)));

      try {
        const response = await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starred: nextStarred }),
        });

        if (!response.ok) {
          setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, starred: !nextStarred } : entry)));
        }
      } catch {
        setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, starred: !nextStarred } : entry)));
      }
    },
    [entries],
  );

  const togglePromote = useCallback(
    async (id: string) => {
      const current = entries.find((entry) => entry.id === id);
      if (!current) return;

      const nextSignal = !Boolean(current.signal);
      setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, signal: nextSignal } : entry)));

      try {
        const response = await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ signal: nextSignal }),
        });

        if (!response.ok) {
          setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, signal: !nextSignal } : entry)));
        }
      } catch {
        setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, signal: !nextSignal } : entry)));
      }
    },
    [entries],
  );

  const markAsPivot = useCallback(
    async (id: string) => {
      const current = entries.find((entry) => entry.id === id);
      if (!current) return;

      const nextPivot = !Boolean(current.isPivot);
      const defaultLabel = current.pivotLabel || current.content || "Pivot";
      const defaultSlot =
        current.slotKind || (current.projects && current.projects.length > 0 ? "project" : current.goals && current.goals.length > 0 ? "goal" : "capture");
      const optimistic = {
        isPivot: nextPivot,
        pivotLabel: nextPivot ? defaultLabel : undefined,
        slotKind: nextPivot ? defaultSlot : undefined,
      };

      setEntries((state) => state.map((entry) => (entry.id === id ? { ...entry, ...optimistic } : entry)));

      try {
        const response = await fetch(`/api/entries/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            isPivot: nextPivot,
            pivotLabel: nextPivot ? defaultLabel : null,
            slotKind: nextPivot ? defaultSlot : null,
          }),
        });

        if (!response.ok) {
          setEntries((state) =>
            state.map((entry) =>
              entry.id === id
                ? { ...entry, isPivot: !nextPivot, pivotLabel: current.pivotLabel, slotKind: current.slotKind }
                : entry,
            ),
          );
        }
      } catch {
        setEntries((state) =>
          state.map((entry) =>
            entry.id === id
              ? { ...entry, isPivot: !nextPivot, pivotLabel: current.pivotLabel, slotKind: current.slotKind }
              : entry,
          ),
        );
      }
    },
    [entries],
  );

  const onSlotClick = (type: "goal" | "project", id: string) => {
    const source = type === "goal" ? goals.find((goal) => goal.id === id) : projects.find((project) => project.id === id);
    if (!source) return;
    if (contextFilter && contextFilter.type === type && contextFilter.id === id) {
      setContextFilter(null);
    } else {
      setView("feed");
      setContextFilter({ type, id, label: source.name });
    }
  };

  const openCreateComposer = useCallback((kind: "goal" | "project", preselectedGoalId?: string | null) => {
    setComposerKind(kind);
    setEditingGoalId(null);
    setEditingProjectId(null);
    setComposerPreselectedGoalId(preselectedGoalId ?? null);
    setComposerOpen(true);
  }, []);

  const openEditComposer = useCallback((kind: "goal" | "project", id: string) => {
    setComposerKind(kind);
    if (kind === "goal") {
      setEditingGoalId(id);
      setEditingProjectId(null);
      setComposerPreselectedGoalId(null);
    } else {
      setEditingProjectId(id);
      setEditingGoalId(null);
      const project = projects.find((item) => item.id === id);
      setComposerPreselectedGoalId(project?.goal_id ?? null);
    }
    setComposerOpen(true);
  }, [projects]);

  const handleComposerSubmit = useCallback(
    async (submission: ComposerSubmitPayload) => {
      const isUpdate = Boolean(submission.id);
      const base = submission.kind === "goal" ? "/api/goals" : "/api/projects";
      const path = isUpdate ? `${base}/${submission.id}` : base;
      const method = isUpdate ? "PATCH" : "POST";

      const response = await fetch(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission.payload),
      });
      if (!response.ok) return;

      if (submission.kind === "goal") {
        const record = (await response.json()) as ThroughlineGoal;
        setGoals((state) => {
          const existing = state.some((item) => item.id === record.id);
          const next = existing ? state.map((item) => (item.id === record.id ? record : item)) : [...state, record];
          return [...next].sort((a, b) => (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER));
        });
      } else {
        const record = (await response.json()) as ThroughlineProject;
        setProjects((state) => {
          const existing = state.some((item) => item.id === record.id);
          const next = existing ? state.map((item) => (item.id === record.id ? record : item)) : [...state, record];
          return [...next].sort((a, b) => (a.order_index ?? Number.MAX_SAFE_INTEGER) - (b.order_index ?? Number.MAX_SAFE_INTEGER));
        });
      }
    },
    [],
  );

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
        if (decision === "promote") return { ...entry, signal: true };
        return entry;
      }),
    );

    void Promise.all(
      Object.entries(decisions).map(async ([id, decision]) => {
        if (decision === "skip") return;
        const patch =
          decision === "star"
            ? { starred: true }
            : decision === "archive"
              ? { archived: true }
              : { signal: true };
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

  const minimap = useMemo<MinimapWeek[]>(() => buildMinimap(entries), [entries]);

  const userLabel = useMemo(() => {
    const profileName = profile?.display_name?.trim();
    if (profileName) return profileName;
    if (userEmail) return userEmail.split("@")[0];
    return undefined;
  }, [profile?.display_name, userEmail]);

  const greetingName = useMemo(() => {
    const profileName = profile?.display_name?.trim();
    return profileName || undefined;
  }, [profile?.display_name]);

  const saveProfile = useCallback(
    async (values: ProfileSettingsFormValues) => {
      const supabase = getSupabaseBrowserClient();
      let activeUserId = userId;
      let activeUserEmail = userEmail ?? null;

      if (!activeUserId) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          activeUserId = user.id;
          activeUserEmail = user.email ?? null;
          setUserId(user.id);
          setUserEmail(user.email ?? undefined);
          setAuthResolved(true);
          void loadProfile(user.id, user.email);
        }
      }

      if (!activeUserId) {
        setProfileSaveError(
          authResolved ? "Your session could not be verified. Please sign in again." : "Still checking your session. Try again in a moment.",
        );
        return;
      }

      const displayName = values.displayName.trim();
      const bio = values.bio.trim();
      if (!displayName) {
        setProfileSaveError("Please add your name.");
        return;
      }

      setProfileSaving(true);
      setProfileSaveError(null);
      try {
        const { data, error } = await supabase
          .from("throughline_profiles")
          .upsert(
            {
              id: activeUserId,
              email: activeUserEmail,
              display_name: displayName.slice(0, 120),
              bio: bio.slice(0, 2000),
              updated_at: new Date().toISOString(),
            },
            { onConflict: "id" },
          )
          .select("id, email, display_name, bio, created_at, updated_at")
          .single();

        if (error) {
          setProfileSaveError("Unable to save profile settings. Please try again.");
          return;
        }

        setProfile(data as ThroughlineProfile);
        setProfileOpen(false);
      } finally {
        setProfileSaving(false);
      }
    },
    [authResolved, loadProfile, userEmail, userId],
  );

  const signOut = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      await supabase.auth.signOut();
    } finally {
      setProfileOpen(false);
      window.location.href = "/login";
    }
  }, []);

  return (
    <>
      <Sidebar
        goals={goals}
        projects={projects}
        activeFilter={contextFilter}
        onSlotClick={onSlotClick}
        onCreate={(kind) => openCreateComposer(kind)}
        onEdit={(kind, id) => openEditComposer(kind, id)}
        onStartReview={() => setReviewOpen(true)}
      />
      <Masthead
        onOpenTweaks={() => setTweaksOpen(true)}
        onView={setView}
        view={view}
        userLabel={userLabel}
        userEmail={userEmail}
        onOpenProfileSettings={() => {
          setProfileSaveError(null);
          setProfileOpen(true);
        }}
      />
      <BigLineBar
        goals={goals}
        projects={projects}
        activeFilter={contextFilter}
        onSlotClick={onSlotClick}
        onCreateSlot={(kind) => openCreateComposer(kind)}
        onEditSlot={(kind, id) => openEditComposer(kind, id)}
        onStartReview={() => setReviewOpen(true)}
      />
      <Minimap data={minimap} />

      {view === "feed" ? (
        <FeedView
          activeGreeting={activeGreeting}
          greetingName={greetingName}
          entries={entries}
          goals={goals}
          projects={projects}
          groupedEntries={grouped}
          filteredEntries={filtered}
          filter={filter}
          setFilter={setFilter}
          contextFilter={contextFilter}
          onClearContextFilter={() => setContextFilter(null)}
          onSetContextFilter={(nextFilter) => setContextFilter(nextFilter)}
          onAddEntry={addEntry}
          onToggleStar={toggleStar}
          onTogglePromote={togglePromote}
          onMarkPivot={markAsPivot}
        />
      ) : null}
      {view === "threads" ? <ThreadsView data={threadsData} isLoading={threadsLoading} entries={entries} /> : null}
      {view === "map" ? (
        <TimelineView
          data={timelineData}
          isLoading={timelineLoading}
          entries={entries}
          onYearChange={(nextYear) => setTimelineYear(clampYear(nextYear))}
        />
      ) : null}

      {reviewOpen ? <WeeklyReview entries={entries} onClose={() => setReviewOpen(false)} onApply={applyReview} /> : null}
      <GoalProjectComposer
        open={composerOpen}
        initialKind={composerKind}
        editingGoal={editingGoalId ? goals.find((goal) => goal.id === editingGoalId) ?? null : null}
        editingProject={editingProjectId ? projects.find((project) => project.id === editingProjectId) ?? null : null}
        preselectedGoalId={composerPreselectedGoalId}
        goals={goals}
        onClose={() => setComposerOpen(false)}
        onSubmit={handleComposerSubmit}
      />
      <ProfileSettings
        open={profileOpen}
        profile={profile}
        email={userEmail}
        isSaving={profileSaving}
        errorMessage={profileSaveError}
        onClose={() => setProfileOpen(false)}
        onSave={saveProfile}
        onSignOut={signOut}
      />
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
