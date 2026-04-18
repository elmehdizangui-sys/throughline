import { NextResponse } from "next/server";
import { updateProject } from "@/lib/throughline-service";
import type { UpdateProjectPayload } from "@/lib/types";

interface Params {
  params: Promise<{ id: string }>;
}

function isValidDate(value: string | undefined | null) {
  if (value === undefined || value === null || value === "") return true;
  return !Number.isNaN(new Date(value).getTime());
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { id } = await params;
    const payload = (await request.json()) as UpdateProjectPayload;
    if (!isValidDate(payload.target_date) || !isValidDate(payload.active_from) || !isValidDate(payload.active_to)) {
      return NextResponse.json({ message: "Invalid date field in project payload." }, { status: 400 });
    }

    const project = await updateProject(id, payload);
    return NextResponse.json(project ?? { id, ...payload });
  } catch (error) {
    console.error("Failed to update project", error);
    return NextResponse.json({ message: "Unable to update project." }, { status: 500 });
  }
}
