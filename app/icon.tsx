import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  const buf = readFileSync(join(process.cwd(), "public/smalllogo.png"));
  const src = `data:image/png;base64,${buf.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: 32,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07090f",
      }}
    >
      <img src={src} width={32} height={32} style={{ objectFit: "contain" }} />
    </div>,
    { ...size }
  );
}
