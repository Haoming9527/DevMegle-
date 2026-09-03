import { NextResponse } from "next/server";
import { getStats } from "@/lib/devmegle-store";

export async function GET() {
  return NextResponse.json({
    success: true,
    stats: getStats(),
  });
}
