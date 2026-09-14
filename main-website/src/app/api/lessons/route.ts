import { NextResponse } from "next/server";
import { listLessons } from "@/lib/lesson/store";

/**
 * The published lessons, as JSON.
 *
 * Reads `public/lessons` on the server — the same directory the player fetches
 * as static assets — so the list and the playable lessons can never disagree.
 * The `/learn` pages call `listLessons` directly rather than through here.
 */
export async function GET() {
  try {
    return NextResponse.json({ lessons: await listLessons() });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
