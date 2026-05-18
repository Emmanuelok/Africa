import { ImageResponse } from "next/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";
export const runtime = "edge";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #b8401f 0%, #d4552a 50%, #bb8540 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif",
          fontWeight: 800,
          fontSize: 38,
          borderRadius: 12
        }}
      >
        S
      </div>
    ),
    { ...size }
  );
}
