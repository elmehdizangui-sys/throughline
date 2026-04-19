import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { FeedView } from "@/features/throughline/feed";
import type { CreateEntryPayload, FeedFilter, ThroughlineEntry, ThroughlineGoal, ThroughlineProject } from "@/lib/types";

function createFakeEditor() {
  let value = "";
  return {
    get document() {
      return [{ id: "mock-block", type: "paragraph", content: value }];
    },
    blocksToMarkdownLossy(_blocks?: unknown) {
      return value;
    },
    blocksToHTMLLossy(_blocks?: unknown) {
      return value ? `<p>${value}</p>` : "<p></p>";
    },
    insertInlineContent(content: string) {
      value += content;
    },
    replaceBlocks() {
      value = "";
    },
    focus() {
      // no-op for tests
    },
    __setValue(next: string) {
      value = next;
    },
  };
}

vi.mock("@blocknote/core", () => ({
  BlockNoteEditor: {
    create: () => createFakeEditor(),
  },
}));

vi.mock("@blocknote/mantine", () => ({
  BlockNoteView: ({
    editor,
    onChange,
    onKeyDownCapture,
    "aria-label": ariaLabel,
    className,
  }: {
    editor: ReturnType<typeof createFakeEditor>;
    onChange?: () => void;
    onKeyDownCapture?: (event: unknown) => void;
    "aria-label"?: string;
    className?: string;
  }) => (
    <textarea
      aria-label={ariaLabel ?? "Capture editor"}
      className={className}
      value={editor.blocksToMarkdownLossy(editor.document)}
      onChange={(event) => {
        editor.__setValue(event.target.value);
        onChange?.();
      }}
      onKeyDown={onKeyDownCapture as any}
    />
  ),
}));

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

    const editor = screen.getByLabelText("Capture editor");
    fireEvent.change(editor, { target: { value: "const answer = 42;" } });
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
    const editor = screen.getByLabelText("Capture editor") as HTMLTextAreaElement;
    expect(editor.value).toContain("https://example.com/docs");

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
