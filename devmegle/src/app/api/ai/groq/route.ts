import { NextRequest, NextResponse } from "next/server";
import { generateAIReply } from "@/lib/ai";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      code?: unknown;
      message?: unknown;
      type?: "chat" | "suggest" | "explain";
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const { response, provider } = await generateAIReply({
      code: typeof body.code === "string" ? body.code : "",
      message: typeof body.message === "string" ? body.message : "",
      type: body.type ?? "chat",
    });

    return NextResponse.json({
      success: true,
      response,
      provider,
      type: body.type ?? "chat",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("AI route error:", error);
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
