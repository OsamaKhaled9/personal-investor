export const runtime = "nodejs";

import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

let cachedSrc: string | null = null;
function getLogoSrc(): string {
  if (!cachedSrc) {
    const buf = readFileSync(join(process.cwd(), "public/smalllogo.png"));
    cachedSrc = `data:image/png;base64,${buf.toString("base64")}`;
  }
  return cachedSrc;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const s = parseInt(sizeParam) || 192;
  if (![192, 512].includes(s))
    return new NextResponse("Not found", { status: 404 });

  const src = getLogoSrc();
  const inner = Math.round(s * 0.78);
  const radius = Math.round(s * 0.18);

  return new ImageResponse(
    <div
      style={{
        width: s,
        height: s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07090f",
        borderRadius: radius,
      }}
    >
      <img
        src={src}
        width={inner}
        height={inner}
        style={{ objectFit: "contain" }}
      />
    </div>,
    { width: s, height: s }
  );
}
