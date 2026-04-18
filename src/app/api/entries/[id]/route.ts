import { NextResponse } from "next/server";
import { patchEntry } from "@/lib/throughline-service";
import type { ThroughlineEntry } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const body = (await request.json()) as Partial<Pick<ThroughlineEntry, "starred" | "archived">>;
    const entry = await patchEntry(id, body);
    return NextResponse.json(entry ?? { id, ...body });
  } catch (error) {
    console.error("Failed to patch entry", error);
    return NextResponse.json({ message: "Unable to patch entry." }, { status: 500 });
  }
}
