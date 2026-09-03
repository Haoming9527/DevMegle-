import { NextRequest, NextResponse } from "next/server";
import { createNextSession } from "@/lib/devmegle-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { sessionId?: unknown; userId?: unknown };

    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const result = createNextSession(String(body.sessionId), body.userId);
    if (!result) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Next endpoint error:", error);
    return NextResponse.json({ error: "Unable to find the next developer" }, { status: 400 });
  }
}
