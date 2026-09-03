import { NextRequest, NextResponse } from "next/server";
import { generateAIReply } from "@/lib/ai";
import { addMessage, getCode, listMessages } from "@/lib/devmegle-store";

const AI_MENTION_REGEX = /(?:what'?s your input\s+['"]?([\w-]+)['"]?|@([\w-]+))/i;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      messages: listMessages(sessionId),
    });
  } catch (error) {
    console.error("Message fetch error:", error);
    return NextResponse.json({ error: "Invalid message request" }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      sender?: unknown;
      content?: unknown;
      code?: unknown;
      type?: "user" | "suggest" | "explain";
    };

    if (!body.sessionId || !body.sender) {
      return NextResponse.json({ error: "sessionId and sender are required" }, { status: 400 });
    }

    const savedMessage =
      body.type === "suggest" || body.type === "explain"
        ? null
        : addMessage({
            sessionId: body.sessionId,
            sender: body.sender,
            content: body.content,
            type: "user",
          });

    if (body.type !== "suggest" && body.type !== "explain" && !savedMessage) {
      return NextResponse.json({ error: "Message could not be saved" }, { status: 400 });
    }

    const content = typeof body.content === "string" ? body.content : "";
    const mention = content.match(AI_MENTION_REGEX);
    const shouldAskAI = body.type === "suggest" || body.type === "explain" || Boolean(mention);
    let ai: string | undefined;

    if (shouldAskAI) {
      const aiName = mention?.[1] || mention?.[2] || "Ada";
      const code = typeof body.code === "string" ? body.code : getCode(String(body.sessionId))?.content ?? "";
      const { response } = await generateAIReply({
        code,
        message: content,
        type: body.type === "suggest" || body.type === "explain" ? body.type : "chat",
      });

      ai = response;
      addMessage({
        sessionId: body.sessionId,
        sender: aiName,
        content: response,
        type: "ai",
      });
    }

    return NextResponse.json({
      success: true,
      message: savedMessage,
      ai,
      messages: listMessages(String(body.sessionId)),
    });
  } catch (error) {
    console.error("Message handler error:", error);
    return NextResponse.json({ error: "Invalid message request" }, { status: 400 });
  }
}
