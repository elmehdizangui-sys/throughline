import { NextResponse } from "next/server";
import { ensureSeedData, getBootstrapData } from "@/lib/throughline-service";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeedData();
    const data = await getBootstrapData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to load bootstrap data", error);
    return NextResponse.json(
      { message: "Unable to load throughline data." },
      { status: 500 },
    );
  }
}
