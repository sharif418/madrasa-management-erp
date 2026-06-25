import { NextResponse } from "next/server";

// GET — handle payment failure/cancel redirect
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cancelled = searchParams.get("cancelled") === "true";
  const view = cancelled ? "cancelled" : "failed";
  return NextResponse.redirect(new URL(`/?view=fees&payment=${view}`, req.url));
}
