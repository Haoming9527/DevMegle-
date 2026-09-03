import { NextRequest, NextResponse } from "next/server";
import { getCode, updateCode } from "@/lib/devmegle-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const code = getCode(sessionId);
    if (!code) {
      return NextResponse.json({ error: "Code buffer not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error("Code fetch error:", error);
    return NextResponse.json({ error: "Invalid code request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      content?: unknown;
      language?: unknown;
      updatedBy?: unknown;
    };

    const code = updateCode({
      sessionId: body.sessionId,
      content: body.content,
      language: body.language,
      updatedBy: body.updatedBy,
    });

    if (!code) {
      return NextResponse.json({ error: "Code buffer could not be updated" }, { status: 400 });
    }

    return NextResponse.json({ success: true, code });
  } catch (error) {
    console.error("Code update error:", error);
    return NextResponse.json({ error: "Invalid code update" }, { status: 400 });
  }
}
