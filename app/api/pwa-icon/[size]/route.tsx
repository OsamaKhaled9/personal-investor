import { ImageResponse } from "next/og";
import { NextResponse } from "next/server";

export const runtime = "edge";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ size: string }> }
) {
  const { size: sizeParam } = await params;
  const s = parseInt(sizeParam) || 192;
  if (![192, 512].includes(s)) return new NextResponse("Not found", { status: 404 });

  const innerSize = Math.round(s * 0.6);
  const radius = Math.round(s * 0.18);

  return new ImageResponse(
    <div
      style={{
        background: "#07090f",
        width: s,
        height: s,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius,
      }}
    >
      <svg width={innerSize} height={innerSize} viewBox="0 0 20 20" fill="none">
        <polyline
          points="2,15 7,9 11,12 18,4"
          stroke="#4ade80"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <polyline
          points="13,4 18,4 18,9"
          stroke="#4ade80"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>,
    { width: s, height: s }
  );
}
