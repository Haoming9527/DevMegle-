import { NextRequest, NextResponse } from "next/server";
import { createRepoExport } from "@/lib/devmegle-store";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      sessionId?: unknown;
      code?: unknown;
      commitMessage?: unknown;
    };

    if (!body.sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
    }

    const repo = await createRepoExport({
      sessionId: body.sessionId,
      code: body.code,
      commitMessage: body.commitMessage,
    });

    if (!repo) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      repo,
      message: "GitHub-ready repo pack created",
    });
  } catch (error) {
    console.error("Git repo creation error:", error);
    return NextResponse.json(
      {
        error: "Failed to create repo pack",
        fallback: "Your code is still saved in the room buffer.",
      },
      { status: 500 }
    );
  }
}
