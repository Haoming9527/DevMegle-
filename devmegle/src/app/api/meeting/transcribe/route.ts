import { NextRequest, NextResponse } from "next/server";
import { addMessage } from "@/lib/devmegle-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      sender?: unknown;
      audioBase64?: unknown;
    };

    if (!body.sessionId || !body.audioBase64) {
      return NextResponse.json({ error: "sessionId and audioBase64 are required" }, { status: 400 });
    }

    const elevenKey = process.env.ELEVENLABS_API_KEY;
    if (!elevenKey) {
      const transcript = "Voice note captured. Add ELEVENLABS_API_KEY to enable live transcription.";
      addMessage({
        sessionId: body.sessionId,
        sender: body.sender ?? "voice-note",
        content: transcript,
        type: "system",
      });
      return NextResponse.json({ success: true, transcript, provider: "local" });
    }

    const audioBuffer = Buffer.from(String(body.audioBase64), "base64");
    const resp = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
      method: "POST",
      headers: {
        "xi-api-key": elevenKey,
        "Content-Type": "audio/webm",
      },
      body: audioBuffer,
    });

    if (!resp.ok) {
      throw new Error(`Transcription failed with ${resp.status}`);
    }

    const data = (await resp.json()) as { text?: string; transcription?: string };
    const transcript = data.text || data.transcription || "Voice note received.";

    addMessage({
      sessionId: body.sessionId,
      sender: body.sender ?? "voice-note",
      content: transcript,
      type: "user",
    });

    return NextResponse.json({ success: true, transcript, provider: "elevenlabs" });
  } catch (error) {
    console.error("Transcription endpoint error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
