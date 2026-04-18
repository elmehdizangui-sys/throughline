import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { ThroughlineEntry, ThroughlineThreadsView } from "@/lib/types";
import { ThreadsView } from "@/features/throughline/threads-view";

const data: ThroughlineThreadsView = {
  from: "2026-01-01T00:00:00.000Z",
  to: "2026-06-30T23:59:59.000Z",
  months: 6,
  rows: [
    {
      id: "g-1",
      kind: "goal",
      name: "Build a business",
      order_index: 0,
      captures: 2,
      signals: 1,
      pivots: 0,
      points: [
        { id: "e-1", created_at: "2026-03-01T12:00:00.000Z", position: 20, kind: "capture" },
        { id: "e-2", created_at: "2026-03-04T12:00:00.000Z", position: 32, kind: "signal" },
      ],
      latest_signal: {
        id: "e-2",
        created_at: "2026-03-04T12:00:00.000Z",
        content: "Shipped first user-visible draft.",
        tags: ["ship"],
      },
    },
    {
      id: "p-1",
      kind: "project",
      parent_goal_id: "g-1",
      name: "Throughline launch",
      order_index: 1,
      captures: 1,
      signals: 1,
      pivots: 0,
      points: [{ id: "e-3", created_at: "2026-03-10T12:00:00.000Z", position: 48, kind: "signal" }],
      latest_signal: {
        id: "e-3",
        created_at: "2026-03-10T12:00:00.000Z",
        content: "Thread detail now supports drill-in.",
        tags: ["product"],
      },
    },
  ],
};

const entries: ThroughlineEntry[] = [
  {
    id: "e-1",
    content: "Need to tighten onboarding copy.",
    created_at: "2026-03-01T12:00:00.000Z",
    goals: ["g-1"],
  },
  {
    id: "e-2",
    content: "Shipped first user-visible draft.",
    created_at: "2026-03-04T12:00:00.000Z",
    goals: ["g-1"],
    starred: true,
  },
  {
    id: "e-3",
    content: "Thread detail now supports drill-in.",
    created_at: "2026-03-10T12:00:00.000Z",
    goals: ["g-1"],
    projects: ["p-1"],
    signal: true,
  },
];

describe("ThreadsView", () => {
  it("shows first thread detail by default and updates capture detail on point click", () => {
    render(<ThreadsView data={data} isLoading={false} entries={entries} />);

    expect(screen.getByRole("heading", { name: "Build a business" })).toBeInTheDocument();
    expect(screen.getByText("Click a bead to inspect a specific capture.")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("thread-point-e-2"));

    expect(screen.getByTestId("thread-capture-detail")).toHaveTextContent("Shipped first user-visible draft.");
    expect(screen.queryByText("Click a bead to inspect a specific capture.")).not.toBeInTheDocument();
  });

  it("switches active thread when selecting another thread name", () => {
    render(<ThreadsView data={data} isLoading={false} entries={entries} />);

    fireEvent.click(screen.getByRole("button", { name: "Open thread Throughline launch" }));

    expect(screen.getByRole("heading", { name: "Throughline launch" })).toBeInTheDocument();
    expect(screen.getByText("1 captures")).toBeInTheDocument();
  });
});
