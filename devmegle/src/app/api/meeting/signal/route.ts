import { NextRequest, NextResponse } from "next/server";
import { addSignal, listSignals } from "@/lib/devmegle-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      signals: listSignals({
        sessionId,
        after: searchParams.get("after") ?? undefined,
        excludeSender: searchParams.get("excludeSender") ?? undefined,
      }),
    });
  } catch (error) {
    console.error("Signal fetch error:", error);
    return NextResponse.json({ error: "Invalid signal request" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      senderSessionId?: unknown;
      type?: unknown;
      payload?: unknown;
    };

    if (!body.sessionId || !body.senderSessionId || !body.type) {
      return NextResponse.json({ error: "sessionId, senderSessionId, and type are required" }, { status: 400 });
    }

    const signal = addSignal({
      sessionId: body.sessionId,
      senderSessionId: body.senderSessionId,
      type: body.type,
      payload: body.payload ?? {},
    });

    if (!signal) {
      return NextResponse.json({ error: "Signal could not be saved" }, { status: 400 });
    }

    return NextResponse.json({ success: true, signal });
  } catch (error) {
    console.error("Signal post error:", error);
    return NextResponse.json({ error: "Invalid signal payload" }, { status: 400 });
  }
}
