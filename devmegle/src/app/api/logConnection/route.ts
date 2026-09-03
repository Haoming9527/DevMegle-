import { NextRequest, NextResponse } from "next/server";
import { logConnection } from "@/lib/devmegle-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      fromUser?: unknown;
      toUser?: unknown;
      connector?: unknown;
    };

    if (!body.sessionId || !body.connector) {
      return NextResponse.json({ error: "sessionId and connector are required" }, { status: 400 });
    }

    const data = logConnection({
      sessionId: body.sessionId,
      fromUser: body.fromUser,
      toUser: body.toUser,
      connector: body.connector,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Connection log error:", error);
    return NextResponse.json({ error: "Invalid connection log request" }, { status: 400 });
  }
}
