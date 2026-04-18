import { describe, expect, it } from "vitest";
import type { ThroughlineEntry } from "@/lib/types";
import { buildMinimap } from "@/lib/minimap";

function isoDaysAgo(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

describe("buildMinimap", () => {
  it("marks capture density levels and pivot flags across weeks", () => {
    const entries: ThroughlineEntry[] = [
      { id: "e1", content: "one", created_at: isoDaysAgo(1) },
      { id: "e2", content: "two", created_at: isoDaysAgo(2) },
      { id: "e3", content: "three", created_at: isoDaysAgo(3) },
      { id: "e4", content: "four", created_at: isoDaysAgo(4), isPivot: true },
    ];

    const minimap = buildMinimap(entries, 2);

    expect(minimap).toHaveLength(2);
    expect(minimap[0].level).toBe(1);
    expect(minimap[0].pivot).toBe(true);
  });
});
