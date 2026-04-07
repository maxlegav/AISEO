import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
  Easing,
  staticFile,
  Img,
} from "remotion";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import {
  OpenAILogo, ClaudeLogo, GeminiLogo, PerplexityLogo, GrokLogo,
} from "./Logos";

// ─── Fonts ─────────────────────────────────────────────────────────────────
const { fontFamily: serif } = loadCormorant("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});
const { fontFamily: sans } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
  ignoreTooManyRequestsWarning: true,
});

// ─── Colors ────────────────────────────────────────────────────────────────
const NAVY   = "#1E293B";
const GRAY   = "#64748B";
const GRAY_L = "#94A3B8";
const PURPLE = "#7C3AED";
const WHITE  = "#FFFFFF";
const TEAL   = "#14B8A6";

// ─── Transition constants ──────────────────────────────────────────────────
const FADE    = 8;
const OVERLAP = 6;

// ─── Helpers ───────────────────────────────────────────────────────────────
const fi = (frame: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(frame, [a, b], [from, to], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const fadeInOut = (frame: number, total: number, len = FADE) =>
  Math.min(fi(frame, 0, len), fi(frame, total - len, total, 1, 0));

const ease = Easing.out(Easing.cubic);
const floatY = (frame: number, amp = 5, period = 100) =>
  Math.sin((frame / period) * Math.PI * 2) * amp;

// ─── Persistent gradient background ────────────────────────────────────────
const BG: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(135deg, #C4B5FD 0%, #E9D5FF 30%, #FBCFE8 65%, #FED7AA 100%)",
      }}
    >
      {[
        { x: -80,  y: 80,   s: 600, c: "rgba(196,181,253,0.45)", ph: 0  },
        { x: 2000, y: 950,  s: 700, c: "rgba(251,207,232,0.35)", ph: 40 },
        { x: 960,  y: -100, s: 500, c: "rgba(253,230,138,0.22)", ph: 20 },
      ].map((b, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: b.x,
            top: b.y + Math.sin(((frame + b.ph) / 120) * Math.PI * 2) * 18,
            width: b.s,
            height: b.s,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${b.c} 0%, transparent 70%)`,
            transform: "translate(-50%,-50%)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

// ─── Brushstroke underline ─────────────────────────────────────────────────
const Brush: React.FC<{ frame: number; start: number; w: number }> = ({
  frame, start, w,
}) => {
  const L = w * 1.07;
  const prog = interpolate(frame, [start, start + 28], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  return (
    <svg
      width={w + 20} height={26}
      viewBox={`0 0 ${w + 20} 26`}
      style={{
        position: "absolute", bottom: -16, left: -10,
        overflow: "visible", pointerEvents: "none",
      }}
    >
      <path
        d={`M6,18 Q${(w + 20) * 0.28},5 ${(w + 20) * 0.52},15 Q${(w + 20) * 0.76},22 ${w + 14},10`}
        fill="none" stroke={PURPLE} strokeWidth={6}
        strokeLinecap="round"
        strokeDasharray={L} strokeDashoffset={L * (1 - prog)}
        opacity={0.85}
      />
    </svg>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// SCENE 1 — Questions
// ──────────────────────────────────────────────────────────────────────────
const QUESTIONS = [
  "How can my brand appear on AI search?",
  "How can I be found in ChatGPT answers?",
  "Best tool for AI search optimization?",
  "How can I boost digital brand visibility?",
];

const CLICK_FRAME  = 105;
const FADEOUT_START = 128;
const FADEOUT_END   = 148;

const AskPill: React.FC<{
  text: string;
  frame: number;
  appearAt: number;
  width: number;
  isLast: boolean;
}> = ({ text, frame, appearAt, width, isLast }) => {
  const { fps } = useVideoConfig();

  const sp = spring({ frame: frame - appearAt, fps, config: { damping: 22, stiffness: 90 } });
  const y  = interpolate(sp, [0, 1], [40, 0]);
  const op = fi(frame, appearAt, appearAt + 12) *
             fi(frame, FADEOUT_START, FADEOUT_END, 1, 0);

  const chars = Math.floor(Math.max(0, frame - appearAt - 8) * 1.5);
  const shown = text.slice(0, chars);
  const cursor = chars < text.length && frame < CLICK_FRAME;

  const pressProgress = isLast
    ? interpolate(frame, [CLICK_FRAME, CLICK_FRAME + 6, CLICK_FRAME + 14], [1, 0.94, 1], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
        easing: Easing.out(Easing.quad),
      })
    : 1;

  const arrowGlow = isLast ? fi(frame, CLICK_FRAME, CLICK_FRAME + 20) : 0;
  const rippleOp  = isLast ? fi(frame, CLICK_FRAME + 4, CLICK_FRAME + 28, 0.6, 0) : 0;
  const rippleScale = isLast ? fi(frame, CLICK_FRAME + 4, CLICK_FRAME + 28, 0.4, 2.2) : 0;
  const isTyped = chars >= text.length;

  return (
    <div style={{ position: "relative", opacity: op, transform: `translateY(${y}px)` }}>
      {/* ripple */}
      <div style={{
        position: "absolute", right: 6, top: "50%",
        width: 62, height: 62, borderRadius: "50%", background: NAVY,
        transform: `translate(0, -50%) scale(${rippleScale})`,
        opacity: rippleOp, pointerEvents: "none",
      }} />

      <div style={{
        width,
        background: "rgba(255,255,255,0.84)",
        backdropFilter: "blur(16px)",
        borderRadius: 100,
        padding: "26px 36px",
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: isLast && frame >= CLICK_FRAME
          ? `0 8px 48px rgba(124,58,237,0.28), 0 2px 8px rgba(0,0,0,0.05)`
          : "0 8px 32px rgba(124,58,237,0.10), 0 2px 8px rgba(0,0,0,0.05)",
        border: "1.5px solid rgba(255,255,255,0.9)",
        transform: `scale(${pressProgress})`,
      }}>
        {/* + icon */}
        <div style={{
          width: 52, height: 52, borderRadius: "50%", background: "#F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <span style={{ fontSize: 28, color: NAVY, fontWeight: 300, lineHeight: 1 }}>+</span>
        </div>

        {/* text */}
        <span style={{ flex: 1, fontSize: 28, fontFamily: sans, color: NAVY, lineHeight: 1.3 }}>
          {shown}
          {cursor && (
            <span style={{
              display: "inline-block", width: 2, height: "1em",
              background: NAVY, marginLeft: 3, verticalAlign: "text-bottom",
              opacity: Math.floor(frame / 8) % 2 === 0 ? 1 : 0,
            }} />
          )}
        </span>

        {/* arrow */}
        <div style={{
          width: 54, height: 54, borderRadius: "50%",
          background: isTyped ? NAVY : "#CBD5E1",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          boxShadow: arrowGlow > 0
            ? `0 0 ${20 * arrowGlow}px ${8 * arrowGlow}px rgba(124,58,237,0.5)`
            : "none",
        }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <path d="M12 4l8 8-8 8M20 12H4" stroke="white" strokeWidth={2.5}
              strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

const SceneQuestions: React.FC = () => {
  const frame = useCurrentFrame();
  const TOTAL = 165;
  const sceneOp = fi(frame, TOTAL - FADE, TOTAL, 1, 0);

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 30, opacity: sceneOp,
    }}>
      {QUESTIONS.map((q, i) => (
        <AskPill
          key={i}
          text={q}
          frame={frame}
          appearAt={i * 24}
          width={920 - i * 10}
          isLast={i === QUESTIONS.length - 1}
        />
      ))}
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// SCENE 2 — AI Response
// ──────────────────────────────────────────────────────────────────────────
const SceneAIResponse: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TOTAL = 120;
  const op = fadeInOut(frame, TOTAL);

  const cardSp = spring({ frame, fps, config: { damping: 22, stiffness: 75 } });
  const cardY  = interpolate(cardSp, [0, 1], [36, 0]);
  const cardFloat = floatY(frame, 4, 110);

  const dotAnim = Math.floor(frame / 12) % 3;

  const thinkOp  = Math.min(fi(frame, 4, 16), fi(frame, 30, 42, 1, 0));
  const respOp   = fi(frame, 42, 58);

  const logoOp   = fi(frame, 46, 60);
  const logoSp   = spring({ frame: frame - 46, fps, config: { damping: 16, stiffness: 120 } });
  const logoSc   = interpolate(logoSp, [0, 1], [0.7, 1]);
  const titleOp  = fi(frame, 52, 64);
  const subOp    = fi(frame, 60, 72);
  const divOp    = fi(frame, 68, 78);
  const iconsOp  = fi(frame, 74, 88);

  return (
    <AbsoluteFill style={{
      display: "flex", alignItems: "center", justifyContent: "center", opacity: op,
    }}>
      <div style={{ transform: "scale(1.18)", transformOrigin: "center center" }}>
      <div style={{
        width: 1100,
        background: WHITE,
        borderRadius: 28,
        boxShadow: "0 28px 80px rgba(124,58,237,0.14)",
        overflow: "hidden",
        transform: `translateY(${cardY + cardFloat}px)`,
        border: "1.5px solid rgba(255,255,255,0.9)",
      }}>
        {/* Browser chrome */}
        <div style={{
          background: "#F8FAFC", borderBottom: "1px solid #E2E8F0",
          padding: "16px 24px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{ display: "flex", gap: 7 }}>
            {["#FF5F57","#FFBD2E","#28C840"].map((c,i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c }}/>
            ))}
          </div>
          <div style={{
            background: "#EEF2FF", borderRadius: 8, padding: "7px 18px",
            fontSize: 16, fontFamily: sans, color: GRAY, flex: 1, maxWidth: 340,
          }}>
            ask.ai
          </div>
        </div>

        {/* Chat body */}
        <div style={{ padding: "40px 64px 32px" }}>
          {/* User bubble */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 32 }}>
            <div style={{
              background: "#F1F5F9", borderRadius: "18px 18px 4px 18px",
              padding: "16px 26px", maxWidth: 620,
              fontSize: 24, fontFamily: sans, color: NAVY, lineHeight: 1.5,
            }}>
              How can I boost digital brand visibility?
            </div>
          </div>

          {/* AI row */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", minHeight: 90 }}>
            {/* Avatar */}
            <div style={{
              width: 44, height: 44, borderRadius: "50%",
              background: "linear-gradient(135deg, #C4B5FD, #FBCFE8)",
              flexShrink: 0, marginTop: 3,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 22,
            }}>✦</div>

            <div style={{ flex: 1 }}>
              {/* Loading dots */}
              <div style={{ display: "flex", gap: 8, alignItems: "center", opacity: thinkOp, padding: "12px 0" }}>
                {[0,1,2].map(i => (
                  <div key={i} style={{
                    width: 12, height: 12, borderRadius: "50%", background: GRAY_L,
                    transform: `translateY(${dotAnim === i ? -5 : 0}px)`,
                    opacity: dotAnim === i ? 1 : 0.4,
                  }}/>
                ))}
              </div>

              {/* Response card */}
              <div style={{ opacity: respOp }}>
                {/* Logo + Brand name */}
                <div style={{
                  display: "flex", alignItems: "center", gap: 20,
                  marginBottom: 18,
                  opacity: logoOp,
                  transform: `scale(${logoSc})`,
                  transformOrigin: "left center",
                }}>
                  <Img
                    src={staticFile("logopdp.jpg")}
                    style={{ width: 72, height: 72, borderRadius: 18, objectFit: "cover",
                      boxShadow: "0 4px 16px rgba(124,58,237,0.2)" }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    <span style={{
                      fontSize: 40, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -0.5,
                    }}>
                      ShowYourBrand
                    </span>
                    <span style={{ fontSize: 15, fontFamily: sans, color: GRAY_L, letterSpacing: 1 }}>
                      GEO PLATFORM
                    </span>
                  </div>
                </div>

                {/* Subtitle */}
                <p style={{
                  fontSize: 26, fontFamily: sans, fontStyle: "italic",
                  color: GRAY, lineHeight: 1.5, margin: "0 0 24px 0",
                  opacity: subOp,
                }}>
                  The first GEO platform for AI search visibility
                </p>

                {/* Divider */}
                <div style={{
                  height: 1, background: "#E2E8F0", marginBottom: 22, opacity: divOp,
                }}/>

                {/* Action icons */}
                <div style={{ display: "flex", gap: 26, alignItems: "center", opacity: iconsOp }}>
                  {[
                    <svg key="c" width={22} height={22} viewBox="0 0 24 24" fill="none"><rect x="9" y="9" width="13" height="13" rx="2" stroke={GRAY_L} strokeWidth={2}/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" stroke={GRAY_L} strokeWidth={2}/></svg>,
                    <svg key="u" width={22} height={22} viewBox="0 0 24 24" fill="none"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3H14z" stroke={GRAY_L} strokeWidth={2}/><path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" stroke={GRAY_L} strokeWidth={2}/></svg>,
                    <svg key="d" width={22} height={22} viewBox="0 0 24 24" fill="none"><path d="M10 15v4a3 3 0 003 3l4-9V2H5.72a2 2 0 00-2 1.7l-1.38 9a2 2 0 002 2.3H10z" stroke={GRAY_L} strokeWidth={2}/><path d="M17 2h2.67A2.31 2.31 0 0122 4v7a2.31 2.31 0 01-2.33 2H17" stroke={GRAY_L} strokeWidth={2}/></svg>,
                    <svg key="e" width={22} height={22} viewBox="0 0 24 24" fill="none"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={GRAY_L} strokeWidth={2}/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={GRAY_L} strokeWidth={2}/></svg>,
                    <svg key="r" width={22} height={22} viewBox="0 0 24 24" fill="none"><polyline points="23 4 23 10 17 10" stroke={GRAY_L} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10" stroke={GRAY_L} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"/></svg>,
                  ]}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Ask anything bar */}
        <div style={{ borderTop: "1px solid #F1F5F9", padding: "18px 64px" }}>
          <div style={{
            background: "#F8FAFC", borderRadius: 100, padding: "16px 26px",
            display: "flex", alignItems: "center", gap: 14, border: "1px solid #E2E8F0",
          }}>
            <span style={{ fontSize: 20, color: GRAY_L, fontFamily: sans }}>+ Ask anything</span>
            <div style={{ flex: 1 }}/>
            <div style={{
              width: 40, height: 40, borderRadius: "50%", background: NAVY,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width={18} height={18} viewBox="0 0 24 24" fill="none">
                <path d="M12 4l8 8-8 8M20 12H4" stroke="white" strokeWidth={2.5}
                  strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// SCENE 3 — Brand Reveal
// ──────────────────────────────────────────────────────────────────────────
const SceneBrandReveal: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TOTAL = 150;
  const op = fadeInOut(frame, TOTAL);

  const logoSp = spring({ frame, fps, config: { damping: 18, stiffness: 70 } });
  const logoSc = interpolate(logoSp, [0, 1], [0.6, 1]);
  const logoOp = fi(frame, 0, 18);

  const nameOp = fi(frame, 18, 32);
  const nameY  = interpolate(frame, [18, 32], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  const headOp = fi(frame, 28, 44);
  const headY  = interpolate(frame, [28, 44], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

  const features = [
    { icon: "⚡", text: "100 AI prompts tested per audit" },
    { icon: "🤖", text: "ChatGPT · Claude · Gemini · Perplexity" },
    { icon: "📊", text: "GEO Health Score 0–100%" },
    { icon: "🏆", text: "Competitor visibility analysis" },
  ];

  const badges = [
    { icon: "🔒", text: "SOC2 Ready" },
    { icon: "⭐", text: "4.9/5 on G2" },
    { icon: "🚀", text: "500+ Brands" },
    { icon: "🌍", text: "30+ Countries" },
  ];

  const logoFloat = floatY(frame, 6, 110);
  const BRAND_W = 400;

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 36, opacity: op,
    }}>
      {/* Logo + name badge */}
      <div style={{
        opacity: logoOp, transform: `scale(${logoSc}) translateY(${logoFloat}px)`,
        display: "flex", alignItems: "center", gap: 28,
        background: "rgba(255,255,255,0.78)", backdropFilter: "blur(16px)",
        borderRadius: 140, padding: "18px 48px 18px 20px",
        boxShadow: "0 16px 56px rgba(124,58,237,0.18)",
        border: "2px solid rgba(255,255,255,0.9)",
      }}>
        <Img
          src={staticFile("logopdp.jpg")}
          style={{ width: 120, height: 120, borderRadius: 120, objectFit: "cover",
            boxShadow: "0 8px 24px rgba(124,58,237,0.22)" }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <span style={{ fontSize: 64, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -1, lineHeight: 1 }}>
            ShowYourBrand
          </span>
          <span style={{ fontSize: 18, fontFamily: sans, color: GRAY, letterSpacing: 1.5 }}>
            GENERATIVE ENGINE OPTIMIZATION
          </span>
        </div>
      </div>

      {/* spacer */}
      <div style={{ opacity: nameOp, transform: `translateY(${nameY}px)`, height: 0 }} />

      {/* Headline */}
      <div style={{ opacity: headOp, transform: `translateY(${headY}px)`, textAlign: "center" }}>
        <div style={{
          fontSize: 88, fontFamily: serif, fontWeight: 600, color: NAVY,
          letterSpacing: -0.5, display: "flex", alignItems: "baseline",
          gap: 24, justifyContent: "center",
        }}>
          <span>Mention your</span>
          <span style={{ position: "relative", display: "inline-block" }}>
            Brand
            <Brush frame={frame} start={42} w={BRAND_W} />
          </span>
          <span>on AI</span>
        </div>
      </div>

      {/* Feature pills */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center", maxWidth: 1200 }}>
        {features.map((f, i) => {
          const { fps: vfps } = useVideoConfig();
          const delay = 52 + i * 12;
          const fsp = spring({ frame: frame - delay, fps: vfps, config: { damping: 20, stiffness: 100 } });
          const fop = fi(frame, delay, delay + 14);
          const fsc = interpolate(fsp, [0, 1], [0.8, 1]);
          return (
            <div key={i} style={{
              opacity: fop, transform: `scale(${fsc})`,
              background: "rgba(255,255,255,0.75)", backdropFilter: "blur(12px)",
              borderRadius: 100, padding: "14px 28px",
              display: "flex", alignItems: "center", gap: 12,
              boxShadow: "0 4px 16px rgba(124,58,237,0.10)",
              border: "1.5px solid rgba(255,255,255,0.9)",
            }}>
              <span style={{ fontSize: 24 }}>{f.icon}</span>
              <span style={{ fontSize: 22, fontFamily: sans, color: NAVY, fontWeight: 500 }}>{f.text}</span>
            </div>
          );
        })}
      </div>

      {/* Trust badges */}
      <div style={{ display: "flex", gap: 16, justifyContent: "center" }}>
        {badges.map((b, i) => {
          const { fps: vfps } = useVideoConfig();
          const delay = 100 + i * 10;
          const bop = fi(frame, delay, delay + 14);
          const bsp = spring({ frame: frame - delay, fps: vfps, config: { damping: 20, stiffness: 110 } });
          const bsc = interpolate(bsp, [0, 1], [0.75, 1]);
          return (
            <div key={i} style={{
              opacity: bop, transform: `scale(${bsc})`,
              background: "rgba(124,58,237,0.10)", backdropFilter: "blur(10px)",
              borderRadius: 100, padding: "10px 22px",
              display: "flex", alignItems: "center", gap: 8,
              border: "1.5px solid rgba(124,58,237,0.20)",
            }}>
              <span style={{ fontSize: 18 }}>{b.icon}</span>
              <span style={{ fontSize: 18, fontFamily: sans, color: PURPLE, fontWeight: 600 }}>{b.text}</span>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// SCENE 4 — AI Carousel
// ──────────────────────────────────────────────────────────────────────────
const aiLogos: { name: string; Logo: React.FC<{ size?: number }> }[] = [
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Grok",       Logo: GrokLogo       },
  { name: "OpenAI",     Logo: OpenAILogo     },
  { name: "Claude",     Logo: ClaudeLogo     },
  { name: "Gemini",     Logo: GeminiLogo     },
];

const SceneCarousel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TOTAL = 75;
  const op = fadeInOut(frame, TOTAL);
  const pillFloat = floatY(frame, 5, 100);
  const titleOp = fi(frame, 5, 20);

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 52, opacity: op,
    }}>
      <div style={{ transform: "scale(1.25)", transformOrigin: "center center", display: "flex", flexDirection: "column", alignItems: "center", gap: 52 }}>
      <div style={{
        fontSize: 26, fontFamily: sans, color: GRAY, fontWeight: 600,
        letterSpacing: 2, textTransform: "uppercase", opacity: titleOp,
      }}>
        BE MENTIONED BY:
      </div>

      <div style={{
        background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)",
        borderRadius: 100, padding: "32px 72px",
        display: "flex", alignItems: "center", gap: 72,
        boxShadow: "0 16px 56px rgba(124,58,237,0.13)",
        border: "1.5px solid rgba(255,255,255,0.9)",
        transform: `translateY(${pillFloat}px)`,
      }}>
        {aiLogos.map((logo, i) => {
          const delay = i * 9 + 14;
          const lsp = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
          const lsc = interpolate(lsp, [0, 1], [0.6, 1]);
          const lop = fi(frame, delay, delay + 12);
          return (
            <div key={logo.name} style={{
              display: "flex", alignItems: "center", gap: 14,
              opacity: lop, transform: `scale(${lsc})`,
            }}>
              <logo.Logo size={48} />
              <span style={{ fontSize: 28, fontWeight: 700, fontFamily: sans, color: NAVY }}>{logo.name}</span>
            </div>
          );
        })}
      </div>
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// SCENE 5 — Dashboard
// ──────────────────────────────────────────────────────────────────────────
const SceneDashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TOTAL = 120;
  const op = fadeInOut(frame, TOTAL);

  const cardSp = spring({ frame, fps, config: { damping: 22, stiffness: 78 } });
  const cardY  = interpolate(cardSp, [0, 1], [40, 0]);
  const cardFloat = floatY(frame, 4, 120);

  const score    = Math.round(fi(frame, 10, 80, 0, 100));
  const mentions = Math.round(fi(frame, 15, 80, 0, 544));
  const arcProgress = score / 100;

  const platforms = [
    { icon: "G", color: "#4285F4", name: "Google AI Mode", val: 96,  delta: +12 },
    { icon: "✦", color: "#10A37F", name: "ChatGPT",        val: 449, delta: -9  },
    { icon: "✦", color: "#4285F4", name: "Gemini",         val: 96,  delta: +12 },
  ];

  const headerOp = fi(frame, 5, 18);

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      opacity: op,
    }}>
      {/* scale up card */}
      <div style={{ transform: "scale(1.35)", transformOrigin: "center center" }}>
        <div style={{
          width: 1000, background: WHITE, borderRadius: 28,
          boxShadow: "0 24px 80px rgba(124,58,237,0.14)",
          overflow: "hidden",
          transform: `translateY(${cardY + cardFloat}px)`,
          border: "1.5px solid rgba(255,255,255,0.9)",
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "22px 36px 18px",
            borderBottom: "1px solid #F1F5F9",
            opacity: headerOp,
          }}>
            <Img
              src={staticFile("logopdp.jpg")}
              style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover" }}
            />
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: sans, color: NAVY }}>
              ShowYourBrand
            </span>
            <div style={{
              marginLeft: "auto", fontSize: 14, fontFamily: sans, color: GRAY_L,
              background: "#F1F5F9", borderRadius: 100, padding: "5px 14px",
            }}>
              AI Visibility
            </div>
          </div>

          {/* Main content */}
          <div style={{ padding: "22px 36px 26px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

            {/* Big centered gauge */}
            <svg width={560} height={310} viewBox="0 0 560 310">
              <path d="M60,270 A220,220 0 0 1 500,270"
                fill="none" stroke="#E2E8F0" strokeWidth={30} strokeLinecap="round"/>
              <path d="M60,270 A220,220 0 0 1 500,270"
                fill="none"
                stroke="url(#gaugeGrad)"
                strokeWidth={30}
                strokeLinecap="round"
                strokeDasharray={Math.PI * 220}
                strokeDashoffset={Math.PI * 220 * (1 - arcProgress)}
              />
              <defs>
                <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C4B5FD"/>
                  <stop offset="50%" stopColor={TEAL}/>
                  <stop offset="100%" stopColor="#10B981"/>
                </linearGradient>
              </defs>
              {score > 0 && (() => {
                const angle = Math.PI - arcProgress * Math.PI;
                const nx = 280 + 220 * Math.cos(angle);
                const ny = 270 - 220 * Math.sin(angle);
                return <circle cx={nx} cy={ny} r={16} fill={TEAL} stroke={WHITE} strokeWidth={5}/>;
              })()}
              <text x={280} y={236} textAnchor="middle" fontSize={108}
                fontWeight={800} fontFamily={sans} fill={NAVY}>{score}</text>
              <text x={280} y={284} textAnchor="middle" fontSize={26}
                fontFamily={sans} fill={GRAY}>/100</text>
            </svg>

            {/* Badge */}
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 12, marginTop: -28,
              background: "#ECFDF5", borderRadius: 100, padding: "10px 28px",
            }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: TEAL }}/>
              <span style={{ fontSize: 24, fontWeight: 700, fontFamily: sans, color: "#065F46" }}>
                {score >= 90 ? "Excellent" : score >= 80 ? "Great" : "Good"}
              </span>
            </div>

            {/* Mentions + platforms */}
            <div style={{
              display: "flex", gap: 52, alignItems: "flex-start",
              width: "100%", padding: "18px 0 0",
              borderTop: "1px solid #F1F5F9",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 180 }}>
                <span style={{ fontSize: 16, fontFamily: sans, color: GRAY, fontWeight: 600 }}>Mentions</span>
                <span style={{ fontSize: 50, fontWeight: 800, fontFamily: sans, color: "#3B82F6", lineHeight: 1 }}>
                  {mentions.toLocaleString()}
                </span>
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
                {platforms.map((p, i) => {
                  const rowOp = fi(frame, 55 + i * 10, 68 + i * 10);
                  const rowX  = interpolate(frame, [55 + i * 10, 70 + i * 10], [20, 0], {
                    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease,
                  });
                  return (
                    <div key={i} style={{
                      display: "flex", alignItems: "center", gap: 12,
                      opacity: rowOp, transform: `translateX(${rowX}px)`,
                    }}>
                      <div style={{
                        width: 30, height: 30, borderRadius: "50%", background: p.color + "22",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 15, fontWeight: 700, color: p.color, flexShrink: 0,
                      }}>{p.icon}</div>
                      <span style={{ flex: 1, fontSize: 18, fontFamily: sans, color: NAVY }}>{p.name}</span>
                      <span style={{ fontSize: 18, fontWeight: 700, fontFamily: sans, color: NAVY }}>{p.val}</span>
                      <span style={{ fontSize: 16, fontWeight: 600, fontFamily: sans, color: p.delta > 0 ? "#10B981" : "#EF4444" }}>
                        {p.delta > 0 ? `+${p.delta}` : p.delta}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Ask anything */}
          <div style={{ borderTop: "1px solid #F1F5F9", padding: "16px 36px" }}>
            <div style={{
              background: "#F8FAFC", borderRadius: 100, padding: "14px 24px",
              display: "flex", alignItems: "center", gap: 14, border: "1px solid #E2E8F0",
            }}>
              <span style={{ fontSize: 18, color: GRAY_L, fontFamily: sans }}>+ Ask anything</span>
              <div style={{ flex: 1 }}/>
              <div style={{
                width: 36, height: 36, borderRadius: "50%", background: NAVY,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                  <path d="M12 4l8 8-8 8M20 12H4" stroke="white" strokeWidth={2.5}
                    strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// SCENE 6 — CTA
// ──────────────────────────────────────────────────────────────────────────
const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const TOTAL = 150;
  const op = fadeInOut(frame, TOTAL);

  const logoSp = spring({ frame, fps, config: { damping: 20, stiffness: 72 } });
  const logoSc = interpolate(logoSp, [0, 1], [0.8, 1]);
  const logoOp = fi(frame, 0, 16);

  const ctaOp  = fi(frame, 28, 42);
  const ctaSp  = spring({ frame: frame - 28, fps, config: { damping: 18, stiffness: 90 } });
  const ctaSc  = interpolate(ctaSp, [0, 1], [0.85, 1]);
  const urlOp  = fi(frame, 42, 56);

  const pulse     = 0.8 + Math.sin((frame / 22) * Math.PI) * 0.2;
  const logoFloat = floatY(frame, 6, 100);

  const BRAND_W = 380;

  return (
    <AbsoluteFill style={{
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 40, opacity: op,
    }}>
      <div style={{ transform: "scale(1.2)", transformOrigin: "center center", display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
      {/* Logo badge */}
      <div style={{
        opacity: logoOp,
        transform: `scale(${logoSc}) translateY(${logoFloat}px)`,
        display: "flex", alignItems: "center", gap: 26,
        background: "rgba(255,255,255,0.78)", backdropFilter: "blur(16px)",
        borderRadius: 140, padding: "16px 52px 16px 20px",
        boxShadow: "0 16px 56px rgba(124,58,237,0.20)",
        border: "2px solid rgba(255,255,255,0.9)",
      }}>
        <Img src={staticFile("logopdp.jpg")} style={{
          width: 112, height: 112, borderRadius: 112, objectFit: "cover",
          boxShadow: "0 8px 24px rgba(124,58,237,0.22)",
        }}/>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <span style={{ fontSize: 60, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -1, lineHeight: 1 }}>
            ShowYourBrand
          </span>
          <span style={{ fontSize: 18, fontFamily: sans, color: GRAY, letterSpacing: 1.5 }}>
            GENERATIVE ENGINE OPTIMIZATION
          </span>
        </div>
      </div>

      {/* Headline */}
      <div style={{ opacity: fi(frame, 24, 38), textAlign: "center" }}>
        <div style={{
          fontSize: 88, fontFamily: serif, fontWeight: 600, color: NAVY, letterSpacing: -0.5,
          display: "flex", alignItems: "baseline", gap: 24, justifyContent: "center",
        }}>
          <span>Mention your</span>
          <span style={{ position: "relative", display: "inline-block" }}>
            Brand
            <Brush frame={frame} start={34} w={BRAND_W} />
          </span>
          <span>on AI</span>
        </div>
      </div>

      {/* CTA pill */}
      <div style={{ opacity: ctaOp, transform: `scale(${ctaSc})` }}>
        <div style={{
          background: NAVY, color: WHITE, borderRadius: 100, padding: "24px 64px",
          fontSize: 32, fontWeight: 700, fontFamily: sans,
          boxShadow: `0 0 ${32 * pulse}px ${12 * pulse}px rgba(124,58,237,0.24)`,
          display: "flex", alignItems: "center", gap: 14,
        }}>
          <span style={{ fontSize: 26 }}>📞</span>
          Book a call &amp; Subscribe now
        </div>
      </div>

      {/* URL */}
      <div style={{ opacity: urlOp, fontSize: 26, fontFamily: sans, color: GRAY, letterSpacing: 0.5 }}>
        showyourbrand.app
      </div>
      </div>
    </AbsoluteFill>
  );
};

// ──────────────────────────────────────────────────────────────────────────
// Main composition
// ──────────────────────────────────────────────────────────────────────────
export const SYBVideo: React.FC = () => (
  <AbsoluteFill>
    <BG />
    <Sequence from={0}   durationInFrames={165}><SceneQuestions    /></Sequence>
    <Sequence from={159} durationInFrames={120}><SceneAIResponse   /></Sequence>
    <Sequence from={273} durationInFrames={150}><SceneBrandReveal  /></Sequence>
    <Sequence from={417} durationInFrames={75} ><SceneCarousel     /></Sequence>
    <Sequence from={486} durationInFrames={120}><SceneDashboard    /></Sequence>
    <Sequence from={600} durationInFrames={150}><SceneCTA          /></Sequence>
  </AbsoluteFill>
);
