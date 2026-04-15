import { NextResponse } from "next/server";

// This endpoint has been disabled for security reasons.
// RLS policies must be managed directly in the Supabase dashboard.
export async function GET() {
  return NextResponse.json(
    { error: "Este endpoint ha sido deshabilitado por seguridad." },
    { status: 403 }
  );
}

