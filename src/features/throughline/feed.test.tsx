import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedView } from "@/features/throughline/feed";
import type { CreateEntryPayload, FeedFilter, ThroughlineEntry, ThroughlineGoal, ThroughlineProject } from "@/lib/types";

function renderFeed(overrides?: {
  entries?: ThroughlineEntry[];
  groupedEntries?: Array<{ day: string; items: ThroughlineEntry[] }>;
  onAddEntry?: (payload: CreateEntryPayload) => void;
  onTogglePromote?: (id: string) => void;
  onMarkPivot?: (id: string) => void;
}) {
  const entries =
    overrides?.entries ??
    [
      {
        id: "entry-1",
        content: "Ship meaningful progress",
        created_at: new Date().toISOString(),
      },
    ];
  const groupedEntries = overrides?.groupedEntries ?? [{ day: "Today", items: entries }];
  const goals: ThroughlineGoal[] = [];
  const projects: ThroughlineProject[] = [];
  const onAddEntry = overrides?.onAddEntry ?? vi.fn();
  const onTogglePromote = overrides?.onTogglePromote ?? vi.fn();
  const onMarkPivot = overrides?.onMarkPivot ?? vi.fn();
  const setFilter = vi.fn<(filter: FeedFilter) => void>();
  const onToggleStar = vi.fn<(entryId: string) => void>();
  const onSetContextFilter = vi.fn();

  render(
    <FeedView
      activeGreeting="Morning"
      entries={entries}
      goals={goals}
      projects={projects}
      groupedEntries={groupedEntries}
      filteredEntries={entries}
      filter="all"
      setFilter={setFilter}
      contextFilter={null}
      onClearContextFilter={vi.fn()}
      onSetContextFilter={onSetContextFilter}
      onAddEntry={onAddEntry}
      onToggleStar={onToggleStar}
      onTogglePromote={onTogglePromote}
      onMarkPivot={onMarkPivot}
    />,
  );

  return { onAddEntry, onTogglePromote, onMarkPivot };
}

describe("FeedView interactions", () => {
  it("calls onTogglePromote when clicking Promote action", () => {
    const onTogglePromote = vi.fn();
    renderFeed({ onTogglePromote });

    fireEvent.click(screen.getByRole("button", { name: "Promote ↑" }));
    expect(onTogglePromote).toHaveBeenCalledWith("entry-1");
  });

  it("calls onMarkPivot when clicking Mark as pivot action", () => {
    const onMarkPivot = vi.fn();
    renderFeed({ onMarkPivot });

    fireEvent.click(screen.getByRole("button", { name: "Mark as pivot" }));
    expect(onMarkPivot).toHaveBeenCalledWith("entry-1");
  });

  it("saves captures in code mode when code button is enabled", () => {
    const onAddEntry = vi.fn();
    renderFeed({ entries: [], groupedEntries: [], onAddEntry });

    const textarea = screen.getByPlaceholderText("What's the throughline today?");
    fireEvent.change(textarea, { target: { value: "const answer = 42;" } });
    fireEvent.click(screen.getByTitle("Code block"));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(onAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "const answer = 42;",
        isCode: true,
      }),
    );
  });

  it("inserts a normalized link and sends preview payload", () => {
    const onAddEntry = vi.fn();
    const promptSpy = vi.spyOn(window, "prompt").mockReturnValue("example.com/docs");
    renderFeed({ entries: [], groupedEntries: [], onAddEntry });

    fireEvent.click(screen.getByTitle("Insert link"));
    const textarea = screen.getByPlaceholderText("What's the throughline today?") as HTMLTextAreaElement;
    expect(textarea.value).toContain("https://example.com/docs");

    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(onAddEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        link: expect.objectContaining({
          url: "https://example.com/docs",
          title: "example.com",
        }),
      }),
    );

    promptSpy.mockRestore();
  });

  it("renders a pivot label when transition fields are missing", () => {
    const pivotEntry: ThroughlineEntry = {
      id: "pivot-1",
      created_at: new Date().toISOString(),
      isPivot: true,
      content: "Renamed roadmap around reliability",
    };
    renderFeed({
      entries: [pivotEntry],
      groupedEntries: [{ day: "Today", items: [pivotEntry] }],
    });

    expect(screen.getByText("Renamed roadmap around reliability")).toBeInTheDocument();
  });
});
