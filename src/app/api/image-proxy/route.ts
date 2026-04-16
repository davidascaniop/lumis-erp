import { NextRequest, NextResponse } from "next/server";

// Proxy server-side para convertir imágenes a base64 y evitar CORS en react-pdf
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) return NextResponse.json({ error: "url requerida" }, { status: 400 });

  try {
    const res = await fetch(url, { cache: "force-cache" });
    if (!res.ok) return NextResponse.json({ error: "no se pudo obtener la imagen" }, { status: 400 });

    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/png";
    const base64 = Buffer.from(buffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return NextResponse.json({ dataUrl });
  } catch {
    return NextResponse.json({ error: "error al procesar imagen" }, { status: 500 });
  }
}
