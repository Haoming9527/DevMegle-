import { NextRequest, NextResponse } from "next/server";
import { endSession, getSession, updateSession } from "@/lib/devmegle-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = getSession(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json({ error: "Invalid session request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      updates?: { status?: "waiting" | "active" | "ended"; report_reason?: string };
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = updateSession(String(body.sessionId), body.updates ?? {});
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json({ error: "Invalid session update" }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");
    const reason = searchParams.get("reason") ?? undefined;

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const session = endSession(sessionId, reason);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      session,
      message: "Session ended successfully",
    });
  } catch (error) {
    console.error("Session end error:", error);
    return NextResponse.json({ error: "Invalid session end request" }, { status: 400 });
  }
}
