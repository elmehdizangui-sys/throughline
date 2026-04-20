import { NextResponse } from "next/server";
import { patchEntry } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { PatchEntryPayload } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidPriority(value: unknown): value is PatchEntryPayload["priority"] {
  return value === undefined || value === null || value === "dunya" || value === "akhirah";
}

function isValidHeartState(value: unknown): boolean {
  return value === undefined || value === null || value === "open" || value === "clear" || value === "clouded" || value === "contracted";
}

function hasSupportedPatchField(patch: PatchEntryPayload) {
  return (
    patch.starred !== undefined ||
    patch.archived !== undefined ||
    patch.signal !== undefined ||
    patch.isPivot !== undefined ||
    patch.from !== undefined ||
    patch.to !== undefined ||
    patch.slotKind !== undefined ||
    patch.pivotLabel !== undefined ||
    patch.priority !== undefined ||
    patch.stateOfHeart !== undefined
  );
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = (await request.json()) as PatchEntryPayload;
    if (!isValidPriority(body.priority)) {
      return NextResponse.json({ message: "Priority must be either 'dunya' or 'akhirah'." }, { status: 400 });
    }
    if (!isValidHeartState(body.stateOfHeart)) {
      return NextResponse.json({ message: "stateOfHeart must be one of: open, clear, clouded, contracted." }, { status: 400 });
    }
    if (!hasSupportedPatchField(body)) {
      return NextResponse.json({ message: "No valid fields to update." }, { status: 400 });
    }

    const entry = await patchEntry(id, body, user.id);
    if (!entry) {
      return NextResponse.json({ message: "No valid fields to update." }, { status: 400 });
    }

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to patch entry", error);
    return NextResponse.json({ message: "Unable to patch entry." }, { status: 500 });
  }
}
