import { NextResponse } from "next/server";
import { createEntry } from "@/lib/throughline-service";
import type { CreateEntryPayload } from "@/lib/types";

function isValidPriority(value: unknown): value is CreateEntryPayload["priority"] {
  return value === undefined || value === "dunya" || value === "akhirah";
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateEntryPayload;
    if (!payload.content || !payload.content.trim()) {
      return NextResponse.json({ message: "Content is required." }, { status: 400 });
    }
    if (!isValidPriority(payload.priority)) {
      return NextResponse.json({ message: "Priority must be either 'dunya' or 'akhirah'." }, { status: 400 });
    }

    const entry = await createEntry({
      content: payload.content.trim(),
      goals: payload.goals ?? [],
      projects: payload.projects ?? [],
      tags: payload.tags ?? [],
      isCode: Boolean(payload.isCode),
      signal: Boolean(payload.signal),
      isPivot: Boolean(payload.isPivot),
      from: payload.from,
      to: payload.to,
      slotKind: payload.slotKind,
      pivotLabel: payload.pivotLabel,
      priority: payload.priority,
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create entry", error);
    return NextResponse.json({ message: "Unable to create entry." }, { status: 500 });
  }
}
