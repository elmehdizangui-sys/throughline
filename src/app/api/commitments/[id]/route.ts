import { NextResponse } from "next/server";
import { patchCommitment, deleteCommitment } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { PatchCommitmentPayload } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const body = (await request.json()) as PatchCommitmentPayload;
    const result = await patchCommitment(id, body);
    return NextResponse.json(result ?? { id });
  } catch (error) {
    console.error("Failed to patch commitment", error);
    return NextResponse.json({ message: "Unable to update commitment." }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    await deleteCommitment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete commitment", error);
    return NextResponse.json({ message: "Unable to delete commitment." }, { status: 500 });
  }
}
