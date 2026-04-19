import { NextResponse } from "next/server";
import { updateGoal } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { UpdateGoalPayload } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidDate(value: string | undefined | null) {
  if (value === undefined || value === null || value === "") return true;
  return !Number.isNaN(new Date(value).getTime());
}

export async function PATCH(request: Request, { params }: Params) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await params;
    const payload = (await request.json()) as UpdateGoalPayload;
    if (!isValidDate(payload.target_date) || !isValidDate(payload.active_from) || !isValidDate(payload.active_to)) {
      return NextResponse.json({ message: "Invalid date field in goal payload." }, { status: 400 });
    }

    const goal = await updateGoal(id, payload);
    return NextResponse.json(goal ?? { id, ...payload });
  } catch (error) {
    console.error("Failed to update goal", error);
    return NextResponse.json({ message: "Unable to update goal." }, { status: 500 });
  }
}
