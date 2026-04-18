import { NextResponse } from "next/server";
import { createEntry } from "@/lib/throughline-service";
import type { CreateEntryPayload, ThroughlineLink } from "@/lib/types";

function isValidPriority(value: unknown): value is CreateEntryPayload["priority"] {
  return value === undefined || value === "dunya" || value === "akhirah";
}

function parseLink(value: unknown): ThroughlineLink | undefined {
  if (value == null) return undefined;
  if (typeof value !== "object") return undefined;

  const raw = value as Partial<ThroughlineLink>;
  if (!raw.url || typeof raw.url !== "string") return undefined;

  try {
    const parsed = new URL(raw.url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return undefined;

    const title = typeof raw.title === "string" && raw.title.trim() ? raw.title.trim() : parsed.hostname;
    const desc = typeof raw.desc === "string" ? raw.desc.trim() : "";
    return {
      url: parsed.toString(),
      title: title.slice(0, 120),
      desc: desc.slice(0, 240),
    };
  } catch {
    return undefined;
  }
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
    if (payload.link !== undefined && !parseLink(payload.link)) {
      return NextResponse.json({ message: "Link must be a valid http(s) URL." }, { status: 400 });
    }

    const entry = await createEntry({
      content: payload.content.trim(),
      goals: payload.goals ?? [],
      projects: payload.projects ?? [],
      tags: payload.tags ?? [],
      isCode: Boolean(payload.isCode),
      link: parseLink(payload.link),
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
