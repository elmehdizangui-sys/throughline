import { NextResponse } from "next/server";
import { createProject } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { CreateProjectPayload } from "@/lib/types";

function isValidDate(value: string | undefined) {
  if (!value) return true;
  return !Number.isNaN(new Date(value).getTime());
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const payload = (await request.json()) as CreateProjectPayload;
    if (!payload.name || !payload.name.trim()) {
      return NextResponse.json({ message: "Project name is required." }, { status: 400 });
    }
    if (!isValidDate(payload.target_date) || !isValidDate(payload.active_from) || !isValidDate(payload.active_to)) {
      return NextResponse.json({ message: "Invalid date field in project payload." }, { status: 400 });
    }

    const project = await createProject(
      {
        name: payload.name.trim(),
        goal_id: payload.goal_id ?? null,
        color: payload.color,
        tag: payload.tag,
        target_date: payload.target_date,
        active_from: payload.active_from,
        active_to: payload.active_to,
        order_index: payload.order_index,
        status: payload.status,
      },
      user.id,
    );
    return NextResponse.json(project, { status: 201 });
  } catch (error) {
    console.error("Failed to create project", error);
    return NextResponse.json({ message: "Unable to create project." }, { status: 500 });
  }
}
