import { NextResponse } from "next/server";
import { createEntry } from "@/lib/throughline-service";
import type { CreateEntryPayload } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as CreateEntryPayload;
    if (!payload.content || !payload.content.trim()) {
      return NextResponse.json({ message: "Content is required." }, { status: 400 });
    }

    const entry = await createEntry({
      content: payload.content.trim(),
      goals: payload.goals ?? [],
      projects: payload.projects ?? [],
      tags: payload.tags ?? [],
      isCode: Boolean(payload.isCode),
    });
    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create entry", error);
    return NextResponse.json({ message: "Unable to create entry." }, { status: 500 });
  }
}
