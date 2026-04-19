import { NextResponse } from "next/server";
import { createCommitment, getCommitmentsForWeek } from "@/lib/throughline-service";
import { getAuthUser } from "@/lib/auth";
import type { CreateCommitmentPayload } from "@/lib/types";

export async function GET(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const weekKey = searchParams.get("week");
    if (!weekKey) return NextResponse.json({ message: "week parameter is required." }, { status: 400 });
    if (!/^\d{4}-W\d{2}$/.test(weekKey)) return NextResponse.json({ message: "Invalid week format." }, { status: 400 });

    const commitments = await getCommitmentsForWeek(weekKey);
    return NextResponse.json(commitments);
  } catch (error) {
    console.error("Failed to load commitments", error);
    return NextResponse.json({ message: "Unable to load commitments." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ message: "Unauthorized" }, { status: 401 });

  try {
    const payload = (await request.json()) as CreateCommitmentPayload;
    if (!payload.text || !payload.text.trim()) {
      return NextResponse.json({ message: "Commitment text is required." }, { status: 400 });
    }
    if (!payload.week_key) {
      return NextResponse.json({ message: "week_key is required." }, { status: 400 });
    }
    if (!/^\d{4}-W\d{2}$/.test(payload.week_key)) {
      return NextResponse.json({ message: "Invalid week_key format." }, { status: 400 });
    }

    const commitment = await createCommitment(
      { text: payload.text.trim(), week_key: payload.week_key, order_index: payload.order_index },
      user.id,
    );
    return NextResponse.json(commitment, { status: 201 });
  } catch (error) {
    console.error("Failed to create commitment", error);
    return NextResponse.json({ message: "Unable to create commitment." }, { status: 500 });
  }
}
