import { ImageResponse } from "next/og";

export const size = {
  width: 64,
  height: 64,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#060606",
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 999,
          backgroundColor: "#000000",
          border: "6px solid #f97316",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ffffff",
          fontSize: 18,
          fontWeight: 900,
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, Arial",
          letterSpacing: -0.6,
        }}
      >
        BBM
      </div>
    </div>,
    size,
  );
}
