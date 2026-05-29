import { ImageResponse } from "next/og";
import { readFileSync } from "fs";
import { join } from "path";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  const buf = readFileSync(join(process.cwd(), "public/smalllogo.png"));
  const src = `data:image/png;base64,${buf.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: 180,
        height: 180,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#07090f",
        borderRadius: 40,
      }}
    >
      <img
        src={src}
        width={140}
        height={140}
        style={{ objectFit: "contain" }}
      />
    </div>,
    { ...size }
  );
}
