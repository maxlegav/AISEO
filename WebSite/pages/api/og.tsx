import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

export const config = {
  runtime: "edge",
};

export default function handler(_req: NextRequest) {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #e9d5ff 0%, #fce7f3 40%, #fed7aa 100%)",
          position: "relative",
          fontFamily: "system-ui, -apple-system, sans-serif",
          overflow: "hidden",
        }}
      >
        {/* Background blobs */}
        <div
          style={{
            position: "absolute",
            top: -80,
            left: -80,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(167, 139, 250, 0.45)",
            filter: "blur(60px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: -100,
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "rgba(249, 168, 212, 0.35)",
            filter: "blur(70px)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: "30%",
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: "rgba(253, 186, 116, 0.4)",
            filter: "blur(60px)",
            display: "flex",
          }}
        />

        {/* Card container */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 0,
            zIndex: 1,
            textAlign: "center",
            padding: "0 80px",
          }}
        >
          {/* Logo + brand name */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 32,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: "#7C3AED",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 24,
                fontWeight: 700,
              }}
            >
              S
            </div>
            <span
              style={{
                fontSize: 26,
                fontWeight: 600,
                color: "#111827",
                letterSpacing: "-0.5px",
              }}
            >
              ShowYourBrand
            </span>
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              color: "#111827",
              lineHeight: 1.1,
              marginBottom: 24,
              letterSpacing: "-2px",
            }}
          >
            Stop being{" "}
            <span style={{ color: "#7C3AED" }}>invisible</span>
            {" "}to AI
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 26,
              color: "#374151",
              maxWidth: 820,
              lineHeight: 1.5,
              marginBottom: 48,
            }}
          >
            Audit your brand across 100 AI prompts on ChatGPT, Claude,
            Perplexity &amp; DeepSeek. Get your GEO score &amp; action plan.
          </div>

          {/* AI engines pills */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
            }}
          >
            {["ChatGPT", "Claude", "Perplexity", "DeepSeek", "Grok"].map(
              (name) => (
                <div
                  key={name}
                  style={{
                    background: "rgba(255,255,255,0.75)",
                    border: "1px solid rgba(255,255,255,0.9)",
                    borderRadius: 999,
                    padding: "8px 18px",
                    fontSize: 18,
                    fontWeight: 500,
                    color: "#1f2937",
                    display: "flex",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  {name}
                </div>
              )
            )}
          </div>

          {/* GEO Score badge */}
          <div
            style={{
              marginTop: 44,
              display: "flex",
              alignItems: "center",
              gap: 16,
              background: "rgba(255,255,255,0.8)",
              border: "1px solid rgba(255,255,255,0.95)",
              borderRadius: 20,
              padding: "16px 32px",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #7C3AED, #a855f7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontSize: 18,
                fontWeight: 700,
              }}
            >
              78
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span style={{ fontSize: 16, fontWeight: 600, color: "#111827" }}>
                GEO Health Score
              </span>
              <span style={{ fontSize: 14, color: "#6B7280" }}>
                See how visible your brand is to AI
              </span>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
