import { beforeEach, describe, expect, it, vi } from "vitest";
import { PATCH } from "@/app/api/entries/[id]/route";
import { patchEntry } from "@/lib/throughline-service";

vi.mock("@/lib/throughline-service", () => ({
  patchEntry: vi.fn(),
}));

describe("PATCH /api/entries/[id]", () => {
  const patchEntryMock = vi.mocked(patchEntry);

  beforeEach(() => {
    patchEntryMock.mockReset();
  });

  it("rejects invalid priority values", async () => {
    const request = new Request("http://localhost/api/entries/entry-1", {
      method: "PATCH",
      body: JSON.stringify({ priority: "" }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "entry-1" }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Priority must be either 'dunya' or 'akhirah'.",
    });
    expect(patchEntryMock).not.toHaveBeenCalled();
  });

  it("rejects payloads without supported patch fields", async () => {
    const request = new Request("http://localhost/api/entries/entry-1", {
      method: "PATCH",
      body: JSON.stringify({ unsupported: true }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "entry-1" }) });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "No valid fields to update.",
    });
    expect(patchEntryMock).not.toHaveBeenCalled();
  });

  it("allows clearing priority with null", async () => {
    patchEntryMock.mockResolvedValue({
      id: "entry-1",
      content: "Updated entry",
      created_at: new Date().toISOString(),
      priority: undefined,
    });

    const request = new Request("http://localhost/api/entries/entry-1", {
      method: "PATCH",
      body: JSON.stringify({ priority: null }),
    });

    const response = await PATCH(request, { params: Promise.resolve({ id: "entry-1" }) });

    expect(response.status).toBe(200);
    expect(patchEntryMock).toHaveBeenCalledWith("entry-1", { priority: null });
  });
});
