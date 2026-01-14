import { NextResponse } from "next/server";
import { signIn } from "next-auth/react";

export async function POST() {
  return NextResponse.json({ ok: true });
}

