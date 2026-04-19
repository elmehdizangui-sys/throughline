import { NextResponse } from "next/server";
import { createEntry } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { CreateEntryPayload, ThroughlineLink } from "@/lib/types";

function isValidPriority(value: unknown): value is CreateEntryPayload["priority"] {
  return value === undefined || value === "dunya" || value === "akhirah";
}

function parseLink(value: unknown): ThroughlineLink | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object") return undefined;
  const raw = value as Record<string, unknown>;
  if (typeof raw.url !== "string" || !raw.url) return undefined;
  const title = typeof raw.title === "string" ? raw.title.trim() : "";
  const desc = typeof raw.desc === "string" ? raw.desc.trim() : "";
  return { url: raw.url.trim(), title, desc };
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const payload = (await request.json()) as CreateEntryPayload;
    if (!payload.content || typeof payload.content !== "string") {
      return NextResponse.json({ message: "Entry content is required." }, { status: 400 });
    }
    if (payload.content.length > 100_000) {
      return NextResponse.json({ message: "Entry content exceeds maximum length." }, { status: 400 });
    }
    if (!isValidPriority(payload.priority)) {
      return NextResponse.json({ message: "Priority must be either 'dunya' or 'akhirah'." }, { status: 400 });
    }
    if (payload.link !== undefined && !parseLink(payload.link)) {
      return NextResponse.json({ message: "Invalid link payload." }, { status: 400 });
    }

    const entry = await createEntry(
      {
        content: payload.content.trim(),
        goals: Array.isArray(payload.goals) ? payload.goals : [],
        projects: Array.isArray(payload.projects) ? payload.projects : [],
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        isCode: Boolean(payload.isCode),
        link: parseLink(payload.link),
        signal: Boolean(payload.signal),
        isPivot: Boolean(payload.isPivot),
        from: typeof payload.from === "string" ? payload.from : undefined,
        to: typeof payload.to === "string" ? payload.to : undefined,
        slotKind: typeof payload.slotKind === "string" ? payload.slotKind : undefined,
        pivotLabel: payload.pivotLabel,
        priority: payload.priority,
      },
      user.id,
    );
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create entry", error);
    return NextResponse.json({ message: "Unable to create entry." }, { status: 500 });
  }
}
