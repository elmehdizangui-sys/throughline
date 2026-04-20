import { NextResponse } from "next/server";
import { getMuhasabahReport } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const months = Math.min(6, Math.max(1, Number(searchParams.get("months") ?? "1")));
    const report = await getMuhasabahReport(months);
    return NextResponse.json(report);
  } catch {
    return NextResponse.json({ message: "Unable to generate report." }, { status: 500 });
  }
}
