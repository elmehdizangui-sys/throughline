import { beforeEach, describe, expect, it, vi } from "vitest";
import { createEntry } from "@/lib/throughline-service";

type InsertPayload = Record<string, unknown>;

const singleMock = vi.fn();
const selectMock = vi.fn(() => ({ single: singleMock }));
const insertPayloads: InsertPayload[] = [];
const insertMock = vi.fn((payload: InsertPayload) => {
  insertPayloads.push(payload);
  return { select: selectMock };
});
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/supabase-admin", () => ({
  getSupabaseAdmin: () => ({
    from: fromMock,
  }),
}));

function makeDbEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: "e-test",
    content: "entry",
    created_at: new Date().toISOString(),
    starred: false,
    archived: false,
    goals: [],
    projects: [],
    tags: [],
    is_code: false,
    link: null,
    signal: false,
    is_pivot: false,
    from_text: null,
    to_text: null,
    slot_kind: null,
    pivot_label: null,
    ...overrides,
  };
}

describe("createEntry", () => {
  beforeEach(() => {
    singleMock.mockReset();
    selectMock.mockClear();
    insertMock.mockClear();
    fromMock.mockClear();
    insertPayloads.length = 0;
  });

  it("does not send priority column when omitted", async () => {
    singleMock.mockResolvedValue({
      data: makeDbEntry(),
      error: null,
    });

    await createEntry({
      content: "Capture something important",
    });

    expect(insertPayloads).toHaveLength(1);
    const insertPayload = insertPayloads[0];
    expect(insertPayload).not.toHaveProperty("priority");
  });

  it("retries without priority when db schema is missing the priority column", async () => {
    singleMock
      .mockResolvedValueOnce({
        data: null,
        error: {
          code: "42703",
          message: 'column "priority" of relation "throughline_entries" does not exist',
        },
      })
      .mockResolvedValueOnce({
        data: makeDbEntry(),
        error: null,
      });

    await createEntry({
      content: "Persist with fallback",
      priority: "dunya",
    });

    expect(insertPayloads).toHaveLength(2);
    const firstInsertPayload = insertPayloads[0];
    const fallbackInsertPayload = insertPayloads[1];

    expect(firstInsertPayload.priority).toBe("dunya");
    expect(fallbackInsertPayload).not.toHaveProperty("priority");
  });
});
