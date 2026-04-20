import { NextResponse } from "next/server";
import { createGoal } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { CreateGoalPayload } from "@/lib/types";

const VALID_GOAL_STATUS = ["active", "paused", "someday", "archived"] as const;
const VALID_GOAL_INTENT = ["immediate", "legacy"] as const;

function isValidDate(value: string | undefined) {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const payload = (await request.json()) as CreateGoalPayload;
    if (!payload.name || !payload.name.trim()) {
      return NextResponse.json({ message: "Goal name is required." }, { status: 400 });
    }
    if (!isValidDate(payload.target_date) || !isValidDate(payload.active_from) || !isValidDate(payload.active_to)) {
      return NextResponse.json({ message: "Invalid date field in goal payload." }, { status: 400 });
    }
    if (payload.status && !(VALID_GOAL_STATUS as readonly string[]).includes(payload.status)) {
      return NextResponse.json({ message: "Invalid status value." }, { status: 400 });
    }
    if (payload.primary_intent && !(VALID_GOAL_INTENT as readonly string[]).includes(payload.primary_intent)) {
      return NextResponse.json({ message: "Invalid primary_intent value." }, { status: 400 });
    }

    const goal = await createGoal(
      {
        name: payload.name.trim(),
        color: payload.color,
        target_date: payload.target_date,
        active_from: payload.active_from,
        active_to: payload.active_to,
        order_index: payload.order_index,
        status: payload.status,
        primary_intent: payload.primary_intent,
      },
      user.id,
    );
    return NextResponse.json(goal, { status: 201 });
  } catch (error) {
    console.error("Failed to create goal", error);
    return NextResponse.json({ message: "Unable to create goal." }, { status: 500 });
  }
}
