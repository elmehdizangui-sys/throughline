import { NextResponse } from "next/server";
import { getThreadsView } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const url = new URL(request.url);
    const monthsParam = Number(url.searchParams.get("months") ?? "6");
    const data = await getThreadsView(monthsParam);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load threads view", error);
    return NextResponse.json({ message: "Unable to load threads data." }, { status: 500 });
  }
}
