import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#050505",
        padding: 72,
      }}
    >
      <svg
        width="1200"
        height="630"
        viewBox="0 0 1200 630"
        style={{ position: "absolute", inset: 0 }}
      >
        <defs>
          <radialGradient id="g1" cx="20%" cy="15%" r="65%">
            <stop offset="0" stopColor="rgba(249,115,22,0.42)" />
            <stop offset="1" stopColor="rgba(249,115,22,0)" />
          </radialGradient>
          <radialGradient id="g2" cx="78%" cy="22%" r="62%">
            <stop offset="0" stopColor="rgba(168,85,247,0.38)" />
            <stop offset="1" stopColor="rgba(168,85,247,0)" />
          </radialGradient>
          <radialGradient id="g3" cx="72%" cy="82%" r="68%">
            <stop offset="0" stopColor="rgba(34,211,238,0.32)" />
            <stop offset="1" stopColor="rgba(34,211,238,0)" />
          </radialGradient>
        </defs>
        <rect width="1200" height="630" fill="#050505" />
        <rect width="1200" height="630" fill="url(#g1)" />
        <rect width="1200" height="630" fill="url(#g2)" />
        <rect width="1200" height="630" fill="url(#g3)" />
      </svg>
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: 48,
          border: "1px solid rgba(255,255,255,0.12)",
          background: "rgba(0,0,0,0.55)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          padding: 72,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              color: "rgba(255,255,255,0.78)",
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: 0.2,
            }}
          >
            Semana Santa • 2 a 5 de abril • Enseada dos Corais - PE
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 78,
              fontWeight: 900,
              lineHeight: 1,
              letterSpacing: -1.2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div>Big Brother</div>
            <div>Enseada</div>
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.75)",
              fontSize: 28,
              fontWeight: 600,
              lineHeight: 1.25,
              maxWidth: 720,
            }}
          >
            Experiência na praia com provas, convivência, muita bebida e
            eliminações diárias.
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: 999,
              backgroundColor: "#000000",
              border: "10px solid #f97316",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: 64,
              fontWeight: 900,
              fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
              letterSpacing: -1,
            }}
          >
            BBE
          </div>
        </div>
      </div>
    </div>,
    size,
  );
}
