import { NextRequest, NextResponse } from "next/server";
import { createSession } from "@/lib/devmegle-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { userId?: unknown; preferences?: unknown };
    const result = createSession({
      userId: body.userId,
      preferences: body.preferences,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Meeting creation error:", error);
    return NextResponse.json({ error: "Unable to create a room" }, { status: 500 });
  }
}
