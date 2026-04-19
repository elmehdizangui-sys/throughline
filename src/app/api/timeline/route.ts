import { NextResponse } from "next/server";
import { getTimelineView } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const yearParam = Number(url.searchParams.get("year") ?? `${new Date().getUTCFullYear()}`);
    const data = await getTimelineView(yearParam);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load timeline view", error);
    return NextResponse.json({ message: "Unable to load timeline data." }, { status: 500 });
  }
}
