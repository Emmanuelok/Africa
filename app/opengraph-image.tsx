import { ImageResponse } from "next/og";

export const alt = "Sokoni — Africa's Trade Engine";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const runtime = "edge";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "linear-gradient(135deg, #fbf8f1 0%, #f3ebd6 100%)",
          padding: 80,
          fontFamily: "system-ui, sans-serif"
        }}
      >
        {/* logo + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              background: "linear-gradient(135deg, #b8401f 0%, #d4552a 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: 36,
              fontWeight: 800
            }}
          >
            S
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#0f0f0e" }}>
            Sokoni<span style={{ color: "#b8401f" }}>.</span>
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            marginTop: "auto",
            marginBottom: 40
          }}
        >
          <div
            style={{
              fontSize: 30,
              color: "#b8401f",
              fontWeight: 600,
              letterSpacing: 1
            }}
          >
            AfriOrigin — AfCFTA compliance in seconds
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#0f0f0e",
              lineHeight: 1.05,
              marginTop: 16,
              maxWidth: 1000
            }}
          >
            Africa&apos;s trade engine.
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#444440",
              marginTop: 20,
              maxWidth: 1000
            }}
          >
            One platform. 54 states. 1.3B people. The open TradeOS for AfCFTA.
          </div>
        </div>

        {/* footer chips */}
        <div style={{ display: "flex", gap: 16, fontSize: 22 }}>
          <span style={chip}>AI HS classification</span>
          <span style={chip}>Rules of Origin</span>
          <span style={chip}>Certificate of Origin PDF</span>
          <span style={chip}>5 languages</span>
        </div>
      </div>
    ),
    { ...size }
  );
}

const chip = {
  background: "white",
  border: "1px solid #d1d1cd",
  padding: "10px 20px",
  borderRadius: 999,
  color: "#3c3c39"
} as const;
