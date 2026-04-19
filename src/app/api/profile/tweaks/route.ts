import { NextResponse } from "next/server";
import { syncProfileTweaks } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";

const ALLOWED_TWEAKS_KEYS = new Set(["theme", "accent", "layout", "density", "entry", "font", "akhirahLens"]);

function sanitizeTweaks(raw: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(raw).filter(([k]) => ALLOWED_TWEAKS_KEYS.has(k)));
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const raw = (await request.json()) as Record<string, unknown>;
    const tweaks = sanitizeTweaks(raw);
    await syncProfileTweaks(user.id, tweaks);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to sync tweaks", error);
    return NextResponse.json({ message: "Unable to sync tweaks." }, { status: 500 });
  }
}
