import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ThroughlineEntry, ThroughlineTimelineYear } from "@/lib/types";
import { TimelineView } from "@/features/throughline/timeline-view";

const timelineData: ThroughlineTimelineYear = {
  year: 2026,
  nowWeek: 2,
  weeks: [
    {
      week: 1,
      start: "2026-01-01T00:00:00.000Z",
      end: "2026-01-07T23:59:59.000Z",
      captures: 1,
      signals: 0,
      pivots: 0,
    },
    {
      week: 2,
      start: "2026-01-08T00:00:00.000Z",
      end: "2026-01-14T23:59:59.000Z",
      captures: 3,
      signals: 2,
      pivots: 1,
    },
  ],
  pivots: [
    {
      id: "pivot-1",
      created_at: "2026-01-10T09:00:00.000Z",
      position: 25,
      label: "Pricing Pivot",
    },
  ],
  ribbons: [
    {
      id: "g-1",
      kind: "goal",
      label: "Build a business",
      start: "2026-01-01T00:00:00.000Z",
      end: "2026-12-31T23:59:59.000Z",
      startPosition: 0,
      endPosition: 100,
    },
  ],
};

const entries: ThroughlineEntry[] = [
  {
    id: "e-1",
    content: "Kickoff week notes",
    created_at: "2026-01-03T09:00:00.000Z",
  },
  {
    id: "e-2",
    content: "Big signal in week two",
    created_at: "2026-01-09T09:30:00.000Z",
    starred: true,
  },
  {
    id: "e-3",
    content: "Pivoted positioning",
    created_at: "2026-01-10T09:00:00.000Z",
    isPivot: true,
    pivotLabel: "Pricing Pivot",
  },
];

describe("TimelineView", () => {
  it("initializes on nowWeek and switches selected week when bar is clicked", () => {
    const onYearChange = vi.fn();
    render(<TimelineView data={timelineData} isLoading={false} entries={entries} onYearChange={onYearChange} />);

    expect(screen.getByTestId("timeline-week-meta")).toHaveTextContent("Week 2");
    expect(screen.getByText("Big signal in week two")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("timeline-week-1"));

    expect(screen.getByTestId("timeline-week-meta")).toHaveTextContent("Week 1");
    expect(screen.getByText("No signal entries for this week.")).toBeInTheDocument();
  });

  it("calls year change callbacks from navigation", () => {
    const onYearChange = vi.fn();
    render(<TimelineView data={timelineData} isLoading={false} entries={entries} onYearChange={onYearChange} />);

    fireEvent.click(screen.getByRole("button", { name: /2025/ }));
    fireEvent.click(screen.getByRole("button", { name: /2027/ }));

    expect(onYearChange).toHaveBeenNthCalledWith(1, 2025);
    expect(onYearChange).toHaveBeenNthCalledWith(2, 2027);
  });

  it("supports keyboard navigation across week bars", () => {
    const onYearChange = vi.fn();
    render(<TimelineView data={timelineData} isLoading={false} entries={entries} onYearChange={onYearChange} />);

    const weekTwo = screen.getByTestId("timeline-week-2");
    fireEvent.keyDown(weekTwo, { key: "ArrowLeft" });

    expect(screen.getByTestId("timeline-week-meta")).toHaveTextContent("Week 1");
  });
});
