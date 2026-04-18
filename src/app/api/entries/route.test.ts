import { describe, expect, it, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/entries/route";
import { createEntry } from "@/lib/throughline-service";

vi.mock("@/lib/throughline-service", () => ({
  createEntry: vi.fn(),
}));

describe("POST /api/entries", () => {
  const createEntryMock = vi.mocked(createEntry);

  beforeEach(() => {
    createEntryMock.mockReset();
  });

  it("rejects invalid priority values", async () => {
    const request = new Request("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "Valid content", priority: "" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      message: "Priority must be either 'dunya' or 'akhirah'.",
    });
    expect(createEntryMock).not.toHaveBeenCalled();
  });

  it("creates an entry when priority is valid", async () => {
    createEntryMock.mockResolvedValue({
      id: "entry-1",
      content: "New entry",
      created_at: new Date().toISOString(),
      priority: "dunya",
    });

    const request = new Request("http://localhost/api/entries", {
      method: "POST",
      body: JSON.stringify({ content: "   New entry   ", priority: "dunya" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(201);
    expect(createEntryMock).toHaveBeenCalledWith(
      expect.objectContaining({
        content: "New entry",
        priority: "dunya",
      }),
    );
  });
});
