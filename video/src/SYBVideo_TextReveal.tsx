/**
 * SYBVideo_TextReveal — Landscape 1920 × 1080  |  38 s @ 30 fps = 1 140 frames
 *
 * Narrative arc (English, voiceover subtitles):
 *  1. The shift   – "AI is the new search engine"  (word-by-word reveal)
 *  2. The problem – Google vs AI — which world are you optimizing for?
 *  3. Social proof – +40 brands already adapted
 *  4. How it works – feature grid
 *  5. Results     – average GEO score 87/100
 *  6. Join them   – AI platforms + "you're next"
 *  7. CTA         – Book a free call
 *  8. Outro       – ShowYourBrand logo + tagline
 */
import React from "react";
import {
  AbsoluteFill, interpolate, spring,
  useCurrentFrame, useVideoConfig,
  Sequence, Easing, staticFile, Img,
} from "remotion";
import { loadFont as loadInter }     from "@remotion/google-fonts/Inter";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";
import {
  OpenAILogo, ClaudeLogo, GeminiLogo, PerplexityLogo, GrokLogo,
} from "./Logos";

// ── Fonts ─────────────────────────────────────────────────────────────────────
const { fontFamily: sans } = loadInter("normal", {
  weights: ["400","500","600","700","800"],
  subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});
const { fontFamily: serif } = loadCormorant("normal", {
  weights: ["600","700"],
  subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});

// ── Palette ───────────────────────────────────────────────────────────────────
const NAVY   = "#1E293B";
const GRAY   = "#64748B";
const GRAY_L = "#94A3B8";
const PURPLE = "#7C3AED";
const WHITE  = "#FFFFFF";
const TEAL   = "#14B8A6";
const GREEN  = "#10B981";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fi = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const easeOut   = Easing.out(Easing.cubic);
const easeSpring = Easing.out(Easing.back(1.4));
const FADE = 14;

const sceneOp = (f: number, total: number) =>
  Math.min(fi(f, 0, FADE), fi(f, total - FADE, total, 1, 0));

const slideIn = (f: number, start: number, dy = 28) => ({
  opacity:   fi(f, start, start + 16),
  transform: `translateY(${interpolate(f, [start, start + 18], [dy, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut })}px)`,
});

const floatY = (f: number, amp = 4, period = 120) =>
  Math.sin((f / period) * Math.PI * 2) * amp;

// ── Word-by-word reveal ───────────────────────────────────────────────────────
const WordReveal: React.FC<{
  text: string; frame: number; start: number; delay?: number;
  style?: React.CSSProperties; highlight?: string[];
}> = ({ text, frame: f, start, delay = 8, style = {}, highlight = [] }) => (
  <span style={{ display: "inline", ...style }}>
    {text.split(" ").map((word, i) => {
      const s = start + i * delay;
      const op = fi(f, s, s + 10);
      const y  = interpolate(f, [s, s + 14], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
      const isH = highlight.includes(word.replace(/[.,!?]/g, ""));
      return (
        <span key={i} style={{
          display: "inline-block", opacity: op, transform: `translateY(${y}px)`,
          marginRight: "0.26em",
          color: isH ? PURPLE : undefined,
          fontWeight: isH ? 700 : undefined,
        }}>
          {word}
        </span>
      );
    })}
  </span>
);

// ── Shared background (always the same pastel gradient) ───────────────────────
const BG: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg,#C4B5FD 0%,#E9D5FF 28%,#FBCFE8 62%,#FED7AA 100%)" }}>
      {([
        { x: -80,  y: 80,   s: 900,  c: "rgba(196,181,253,0.42)", ph: 0  },
        { x: 2000, y: 950,  s: 1000, c: "rgba(251,207,232,0.34)", ph: 45 },
        { x: 960,  y: -80,  s: 700,  c: "rgba(253,230,138,0.22)", ph: 22 },
        { x: 1600, y: 200,  s: 500,  c: "rgba(196,181,253,0.16)", ph: 70 },
      ] as const).map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          left: b.x, top: b.y + Math.sin(((f + b.ph) / 130) * Math.PI * 2) * 22,
          width: b.s, height: b.s, borderRadius: "50%",
          background: `radial-gradient(circle,${b.c} 0%,transparent 70%)`,
          transform: "translate(-50%,-50%)",
        }} />
      ))}
    </AbsoluteFill>
  );
};

// ── Subtitle bar ──────────────────────────────────────────────────────────────
const Sub: React.FC<{ text: string; total: number }> = ({ text, total }) => {
  const f = useCurrentFrame();
  const op = Math.min(fi(f, 10, 22), fi(f, total - 12, total, 1, 0));
  const y  = interpolate(f, [10, 22], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  return (
    <div style={{ position: "absolute", bottom: 64, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        transform: `translateY(${y}px)`,
        background: "rgba(15,23,42,0.74)", backdropFilter: "blur(12px)",
        borderRadius: 100, padding: "14px 48px",
        fontSize: 26, fontFamily: sans, color: WHITE,
        textAlign: "center", maxWidth: 1200,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
      }}>
        {text}
      </div>
    </div>
  );
};

// ── Brand badge (logo + "ShowYourBrand" always in NAVY black) ─────────────────
const Brand: React.FC<{ size?: "sm" | "md" | "lg"; from?: number }> = ({ size = "md", from = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: f - from, fps, config: { damping: 18, stiffness: 68 } });
  const sizes = {
    sm: { logo: 44, name: 28, sub: 12, pad: "10px 30px 10px 10px", gap: 12 },
    md: { logo: 64, name: 40, sub: 14, pad: "16px 44px 16px 16px", gap: 18 },
    lg: { logo: 92, name: 56, sub: 16, pad: "20px 56px 20px 20px", gap: 22 },
  };
  const s = sizes[size];
  return (
    <div style={{
      opacity: fi(f, from, from + 18),
      transform: `scale(${interpolate(sp,[0,1],[0.65,1])}) translateY(${floatY(f, 4, 115)}px)`,
      display: "flex", alignItems: "center", gap: s.gap,
      background: "rgba(255,255,255,0.90)", backdropFilter: "blur(18px)",
      borderRadius: 200, padding: s.pad,
      boxShadow: "0 18px 58px rgba(124,58,237,0.18)",
      border: "2px solid rgba(255,255,255,0.9)",
    }}>
      <Img src={staticFile("logopdp.jpg")} style={{
        width: s.logo, height: s.logo, borderRadius: "50%", objectFit: "cover",
        boxShadow: "0 4px 18px rgba(124,58,237,0.22)", flexShrink: 0,
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: s.name, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -0.5, lineHeight: 1 }}>
          ShowYourBrand
        </span>
        <span style={{ fontSize: s.sub, fontFamily: sans, color: GRAY_L, letterSpacing: 1.6, textTransform: "uppercase" }}>
          Generative Engine Optimization
        </span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 1 — The Shift : "AI is the new search engine"  (0 – 155)
// ════════════════════════════════════════════════════════════════════════════
const S1 = 155;

const Scene1: React.FC = () => {
  const f   = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op  = sceneOp(f, S1);

  // Label slide in
  const l1  = slideIn(f, 6, 20);

  // "has changed." — big spring scale pop
  const l2sp = spring({ frame: f - 20, fps, config: { damping: 14, stiffness: 110 } });
  const l2sc = interpolate(l2sp, [0, 1], [0.72, 1]);
  const l2op = fi(f, 20, 34);

  // Underline draw
  const uProg = fi(f, 38, 68);
  const uLen  = 580;

  // AI badge spring pop
  const badgeSp = spring({ frame: f - 54, fps, config: { damping: 16, stiffness: 88 } });
  const badgeSc = interpolate(badgeSp, [0, 1], [0.55, 1]);

  // Stat chip
  const chipOp = fi(f, 98, 114);
  const chipY  = interpolate(f, [98, 114], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, opacity: op }}>
      {/* Label */}
      <div style={{ ...l1, marginBottom: 14 }}>
        <span style={{ fontSize: 28, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 4, textTransform: "uppercase" }}>
          The search landscape
        </span>
      </div>

      {/* "has changed." — cinematic big type */}
      <div style={{ opacity: l2op, transform: `scale(${l2sc})`, position: "relative", display: "inline-block" }}>
        <span style={{ fontSize: 130, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -4, lineHeight: 1, display: "block" }}>
          has changed.
        </span>
        <svg viewBox={`0 0 ${uLen + 20} 22`} style={{ position: "absolute", bottom: -10, left: -8, width: uLen + 20, height: 22, overflow: "visible" }}>
          <path
            d={`M4,16 Q${uLen * 0.3},4 ${uLen * 0.55},14 Q${uLen * 0.77},22 ${uLen + 12},9`}
            fill="none" stroke={PURPLE} strokeWidth={5} strokeLinecap="round"
            strokeDasharray={uLen * 1.12} strokeDashoffset={uLen * 1.12 * (1 - uProg)}
            opacity={0.85}
          />
        </svg>
      </div>

      {/* ✦ AI badge */}
      <div style={{
        opacity: fi(f, 54, 70),
        transform: `scale(${badgeSc}) translateY(${floatY(f, 3, 112)}px)`,
        marginTop: 52,
        display: "flex", alignItems: "center", gap: 16,
        background: "rgba(255,255,255,0.90)", backdropFilter: "blur(18px)",
        borderRadius: 200, padding: "16px 44px 16px 18px",
        border: "1.5px solid rgba(124,58,237,0.22)",
        boxShadow: "0 18px 50px rgba(124,58,237,0.16)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: `linear-gradient(135deg,${PURPLE},${TEAL})`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <span style={{ fontSize: 22, color: WHITE, fontWeight: 800, fontFamily: sans }}>✦</span>
        </div>
        <span style={{ fontSize: 36, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -0.5 }}>
          AI is the new search engine
        </span>
      </div>

      {/* Stat chip */}
      <div style={{
        opacity: chipOp, transform: `translateY(${chipY}px)`,
        marginTop: 34,
        background: "rgba(255,255,255,0.82)", backdropFilter: "blur(14px)",
        borderRadius: 100, padding: "14px 40px",
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 6px 24px rgba(124,58,237,0.10)",
      }}>
        <span style={{ fontSize: 24, fontFamily: sans, color: NAVY }}>
          <span style={{ fontWeight: 700, color: PURPLE }}>70%</span> of users now start their search on AI
        </span>
      </div>

      <Sub text="The way people discover brands has fundamentally changed." total={S1} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 2 — The Problem : Google vs AI  (140 – 300)
// ════════════════════════════════════════════════════════════════════════════
const S2 = 160;

const Scene2: React.FC = () => {
  const f  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S2);

  const labelOp = slideIn(f, 6, 22).opacity;

  const sp1 = spring({ frame: f - 16, fps, config: { damping: 20, stiffness: 78 } });
  const sp2 = spring({ frame: f - 38, fps, config: { damping: 20, stiffness: 78 } });

  const q = slideIn(f, 95, 22);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: op }}>
      <div style={{ opacity: labelOp, fontSize: 24, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        Two worlds. One winner.
      </div>

      {/* Side-by-side cards */}
      <div style={{ display: "flex", gap: 40, alignItems: "stretch" }}>
        {/* Old world — Google */}
        <div style={{
          opacity: fi(f, 16, 32),
          transform: `translateX(${interpolate(sp1, [0,1], [-60, 0])}px) scale(${interpolate(sp1,[0,1],[0.88,1])})`,
          width: 640, background: "rgba(255,255,255,0.78)", backdropFilter: "blur(14px)",
          borderRadius: 28, padding: "36px 44px",
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 12px 40px rgba(0,0,0,0.08)",
          display: "flex", flexDirection: "column", gap: 22,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 40, fontWeight: 700, fontFamily: sans }}>
              <span style={{ color: "#4285F4" }}>G</span>
              <span style={{ color: "#EA4335" }}>o</span>
              <span style={{ color: "#FBBC04" }}>o</span>
              <span style={{ color: "#4285F4" }}>g</span>
              <span style={{ color: "#34A853" }}>l</span>
              <span style={{ color: "#EA4335" }}>e</span>
            </div>
            <span style={{ fontSize: 18, fontFamily: sans, color: GRAY_L, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginLeft: 8 }}>Old world</span>
          </div>
          <div style={{ background: "#F8FAFC", borderRadius: 100, padding: "14px 22px", display: "flex", alignItems: "center", gap: 10, border: "1px solid #E2E8F0" }}>
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none"><circle cx={11} cy={11} r={8} stroke={GRAY_L} strokeWidth={2}/><path d="M21 21l-4.35-4.35" stroke={GRAY_L} strokeWidth={2} strokeLinecap="round"/></svg>
            <span style={{ fontSize: 20, fontFamily: sans, color: GRAY }}>best [product] brand</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["10 blue links", "Paid ads first", "You scroll to find answers"].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: fi(f, 36 + i * 8, 50 + i * 8) }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: GRAY_L, flexShrink: 0 }} />
                <span style={{ fontSize: 20, fontFamily: sans, color: GRAY }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, fontFamily: sans, fontWeight: 600, color: GRAY_L, background: "#F8FAFC", borderRadius: 100, padding: "8px 20px", alignSelf: "flex-start" }}>
            You optimize for this ✓
          </div>
        </div>

        {/* New world — AI */}
        <div style={{
          opacity: fi(f, 38, 54),
          transform: `translateX(${interpolate(sp2, [0,1], [60, 0])}px) scale(${interpolate(sp2,[0,1],[0.88,1])})`,
          width: 640, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)",
          borderRadius: 28, padding: "36px 44px",
          border: `2px solid rgba(124,58,237,0.28)`,
          boxShadow: "0 20px 60px rgba(124,58,237,0.14)",
          display: "flex", flexDirection: "column", gap: 22,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ fontSize: 36, fontWeight: 800, fontFamily: sans, color: PURPLE }}>✦ AI</div>
            <span style={{ fontSize: 18, fontFamily: sans, color: PURPLE, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginLeft: 8 }}>New world</span>
          </div>
          <div style={{ background: "rgba(124,58,237,0.07)", borderRadius: 100, padding: "14px 22px", display: "flex", alignItems: "center", gap: 10, border: "1px solid rgba(124,58,237,0.15)" }}>
            <span style={{ fontSize: 20, fontFamily: sans, color: PURPLE }}>+ </span>
            <span style={{ fontSize: 20, fontFamily: sans, color: NAVY }}>What's the best brand for [product]?</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {["One direct answer", "Brand recommendation", "Your brand — or your competitor's"].map((t, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, opacity: fi(f, 58 + i * 8, 72 + i * 8) }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: PURPLE, flexShrink: 0 }} />
                <span style={{ fontSize: 20, fontFamily: sans, color: NAVY, fontWeight: i === 2 ? 600 : 400 }}>{t}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 18, fontFamily: sans, fontWeight: 700, color: PURPLE, background: "rgba(124,58,237,0.08)", borderRadius: 100, padding: "8px 20px", alignSelf: "flex-start", border: "1px solid rgba(124,58,237,0.18)" }}>
            Are you optimizing for this? →
          </div>
        </div>
      </div>

      {/* Rhetorical question */}
      <div style={{ ...q, textAlign: "center" }}>
        <span style={{ fontSize: 36, fontFamily: serif, fontStyle: "italic", color: GRAY }}>
          Most brands are invisible to AI. Are you?
        </span>
      </div>

      <Sub text="Most brands are still only optimizing for Google. AI is a blind spot." total={S2} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 3 — Social proof : +40 brands  (285 – 450)
// ════════════════════════════════════════════════════════════════════════════
const S3 = 165;

const Scene3: React.FC = () => {
  const f  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S3);

  const count   = Math.round(fi(f, 8, 28, 0, 40));
  const countSp = spring({ frame: f, fps, config: { damping: 20, stiffness: 62 } });
  const countSc = interpolate(countSp, [0, 1], [0.5, 1]);
  const countOp = fi(f, 5, 22);
  const fl      = floatY(f, 6, 125);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 20, opacity: op }}>
      {/* Giant counter */}
      <div style={{ opacity: countOp, transform: `scale(${countSc}) translateY(${fl}px)`, lineHeight: 1, textAlign: "center" }}>
        <span style={{ fontSize: 280, fontWeight: 800, fontFamily: sans, letterSpacing: -8, display: "block", lineHeight: 1 }}>
          <span style={{ color: TEAL }}>+</span><span style={{ color: NAVY }}>{count}</span>
        </span>
      </div>

      {/* Labels */}
      <div style={{ ...slideIn(f, 55, 22), textAlign: "center" }}>
        <span style={{ fontSize: 52, fontFamily: serif, fontWeight: 600, color: NAVY }}>
          brands already adapted.
        </span>
      </div>

      <div style={{ ...slideIn(f, 72, 20), textAlign: "center" }}>
        <span style={{ fontSize: 30, fontFamily: sans, color: GRAY }}>
          They chose to be visible on AI — before their competitors did.
        </span>
      </div>

      {/* Stars + early access */}
      <div style={{ opacity: fi(f, 95, 112), display: "flex", alignItems: "center", gap: 12, marginTop: 8 }}>
        {[...Array(5)].map((_, i) => (
          <svg key={i} width={34} height={34} viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
              fill="#FBBF24" stroke="#FBBF24" strokeWidth={0.5} />
          </svg>
        ))}
        <span style={{ fontSize: 26, fontFamily: sans, color: GRAY, marginLeft: 8 }}>early access · 4.9/5</span>
      </div>

      <Sub text="40+ forward-thinking brands have already optimized their AI presence." total={S3} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 4 — Features : 2 × 2 grid  (435 – 590)
// ════════════════════════════════════════════════════════════════════════════
const S4 = 155;

const Scene4: React.FC = () => {
  const f  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S4);

  const features = [
    { icon: "🔍", title: "AI Audit",       desc: "100 prompts tested across every major AI model",       color: PURPLE,   delay: 10 },
    { icon: "📊", title: "GEO Score",      desc: "0–100 visibility score per platform",                 color: TEAL,     delay: 28 },
    { icon: "🏆", title: "Competitors",    desc: "See exactly who ranks above you on AI",               color: "#F59E0B", delay: 46 },
    { icon: "⚡", title: "Action Plan",    desc: "Prioritized fixes, instant impact",                   color: GREEN,    delay: 64 },
  ];

  const springs = features.map(feat =>
    spring({ frame: f - feat.delay, fps, config: { damping: 13, stiffness: 115 } })
  );

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: op }}>
      <div style={{ ...slideIn(f, 4, 22), fontSize: 24, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        What you get
      </div>

      {/* 2×2 grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, width: 1200 }}>
        {features.map((feat, i) => {
          const sc  = interpolate(springs[i], [0, 1], [0.76, 1]);
          const tx  = interpolate(springs[i], [0, 1], [i % 2 === 0 ? -90 : 90, 0]);
          const ty  = interpolate(springs[i], [0, 1], [20, 0]);
          const fop = fi(f, feat.delay, feat.delay + 14);
          const fl2 = floatY(f + i * 20, 3.5, 108 + i * 12);
          return (
            <div key={i} style={{
              opacity: fop, transform: `translate(${tx}px, ${ty + fl2}px) scale(${sc})`,
              background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)",
              borderRadius: 28, padding: "34px 40px",
              border: "1.5px solid rgba(255,255,255,0.9)",
              boxShadow: "0 10px 36px rgba(124,58,237,0.09)",
              display: "flex", alignItems: "flex-start", gap: 22,
            }}>
              <div style={{
                width: 64, height: 64, borderRadius: 18, flexShrink: 0,
                background: `${feat.color}18`, border: `1.5px solid ${feat.color}28`,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontSize: 32 }}>{feat.icon}</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <span style={{ fontSize: 28, fontWeight: 700, fontFamily: sans, color: NAVY }}>{feat.title}</span>
                <span style={{ fontSize: 20, fontFamily: sans, color: GRAY, lineHeight: 1.5 }}>{feat.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      <Sub text="Audit. Score. Optimize. Repeat — all in one platform." total={S4} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Results : GEO Score 87/100  (575 – 730)
// ════════════════════════════════════════════════════════════════════════════
const S5 = 155;

const Scene5: React.FC = () => {
  const f  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S5);

  const score   = Math.round(fi(f, 12, 88, 0, 87));
  const arc     = score / 100;
  const cardSp  = spring({ frame: f, fps, config: { damping: 22, stiffness: 72 } });
  const cardY   = interpolate(cardSp, [0, 1], [44, 0]);
  const fl      = floatY(f, 5, 118);

  const rows = [
    { name: "ChatGPT",    val: 449, delta: "+18", color: "#10A37F" },
    { name: "Claude",     val: 312, delta: "+9",  color: "#D97706" },
    { name: "Perplexity", val: 198, delta: "+24", color: "#6366F1" },
    { name: "Gemini",     val: 96,  delta: "+12", color: "#4285F4" },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: op }}>
      {/* Scaled-up dashboard card */}
      <div style={{ transform: `translateY(${cardY + fl}px) scale(1.05)`, transformOrigin: "center center" }}>
        <div style={{
          width: 1060, background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)",
          borderRadius: 32, overflow: "hidden",
          boxShadow: "0 32px 80px rgba(124,58,237,0.16)",
          border: "1.5px solid rgba(255,255,255,0.9)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 36px 18px", borderBottom: "1px solid #F1F5F9", opacity: fi(f, 4, 18) }}>
            <Img src={staticFile("logopdp.jpg")} style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: sans, color: NAVY }}>ShowYourBrand</span>
            <div style={{ marginLeft: "auto", fontSize: 14, fontFamily: sans, color: GRAY_L, background: "#F1F5F9", borderRadius: 100, padding: "5px 14px" }}>
              AI Visibility Dashboard
            </div>
          </div>

          <div style={{ display: "flex", padding: "28px 36px 32px", gap: 48, alignItems: "center" }}>
            {/* Gauge */}
            <div style={{ flexShrink: 0 }}>
              <svg width={420} height={250} viewBox="0 0 420 250">
                <defs>
                  <linearGradient id="gtr" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C4B5FD" />
                    <stop offset="50%" stopColor={TEAL} />
                    <stop offset="100%" stopColor={GREEN} />
                  </linearGradient>
                </defs>
                <path d="M40,230 A170,170 0 0 1 380,230" fill="none" stroke="#E2E8F0" strokeWidth={24} strokeLinecap="round" />
                <path d="M40,230 A170,170 0 0 1 380,230" fill="none" stroke="url(#gtr)" strokeWidth={24} strokeLinecap="round"
                  strokeDasharray={Math.PI * 170} strokeDashoffset={Math.PI * 170 * (1 - arc)} />
                {score > 0 && (() => {
                  const a2 = Math.PI - arc * Math.PI;
                  return <circle cx={210 + 170 * Math.cos(a2)} cy={230 - 170 * Math.sin(a2)} r={12} fill={TEAL} stroke={WHITE} strokeWidth={4} />;
                })()}
                <text x={210} y={200} textAnchor="middle" fontSize={90} fontWeight={800} fontFamily={sans} fill={NAVY}>{score}</text>
                <text x={210} y={240} textAnchor="middle" fontSize={22} fontFamily={sans} fill={GRAY_L}>/100</text>
              </svg>
              {/* Status */}
              <div style={{ display: "flex", justifyContent: "center", marginTop: -8, opacity: fi(f, 88, 104) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#ECFDF5", borderRadius: 100, padding: "9px 24px", border: "1px solid #A7F3D0" }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: TEAL }} />
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: sans, color: "#065F46" }}>Excellent — Top 5%</span>
                </div>
              </div>
            </div>

            {/* Platform rows */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <span style={{ fontSize: 18, fontFamily: sans, fontWeight: 600, color: GRAY_L, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
                Mentions per platform
              </span>
              {rows.map((r, i) => {
                const rop = fi(f, 92 + i * 10, 108 + i * 10);
                const rx  = interpolate(f, [92 + i * 10, 110 + i * 10], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
                return (
                  <div key={i} style={{ opacity: rop, transform: `translateX(${rx}px)`, display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: r.color + "20", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <div style={{ width: 10, height: 10, borderRadius: "50%", background: r.color }} />
                    </div>
                    <span style={{ flex: 1, fontSize: 22, fontFamily: sans, color: NAVY }}>{r.name}</span>
                    <span style={{ fontSize: 22, fontWeight: 700, fontFamily: sans, color: NAVY }}>{r.val}</span>
                    <span style={{ fontSize: 18, fontWeight: 600, color: GREEN, background: "#ECFDF5", borderRadius: 100, padding: "4px 14px" }}>{r.delta}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Sub text="Our users achieve an average GEO score of 87 out of 100." total={S5} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 6 — "You're next" : Join them  (725 – 880)
// ════════════════════════════════════════════════════════════════════════════
const S6 = 155;
const AI_LOGOS = [
  { name: "ChatGPT",    Logo: OpenAILogo     },
  { name: "Claude",     Logo: ClaudeLogo     },
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Gemini",     Logo: GeminiLogo     },
  { name: "Grok",       Logo: GrokLogo       },
];

const Scene6: React.FC = () => {
  const f  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S6);

  const cardSp  = spring({ frame: f, fps, config: { damping: 22, stiffness: 75 } });
  const cardY   = interpolate(cardSp, [0, 1], [44, 0]);
  const fl      = floatY(f, 5, 120);

  const logoSprings = AI_LOGOS.map((_, i) =>
    spring({ frame: f - (26 + i * 12), fps, config: { damping: 18, stiffness: 92 } })
  );

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: op }}>
      {/* Headline */}
      <div style={{ textAlign: "center" }}>
        <div style={{ ...slideIn(f, 6, 30), fontSize: 80, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -2, lineHeight: 1 }}>
          What if AI cited
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22, justifyContent: "center", marginTop: 8 }}>
          <span style={{ ...slideIn(f, 18, 30), fontSize: 80, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -2 }}>your</span>
          <span style={{
            ...slideIn(f, 28, 26),
            fontSize: 80, fontWeight: 800, fontFamily: sans, color: WHITE,
            background: PURPLE, borderRadius: 18, padding: "0 24px", lineHeight: 1.18,
          }}>
            brand
          </span>
          <span style={{ ...slideIn(f, 38, 30), fontSize: 80, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -2 }}>first?</span>
        </div>
      </div>

      {/* AI logos pill */}
      <div style={{
        transform: `translateY(${cardY + fl}px)`,
        background: "rgba(255,255,255,0.86)", backdropFilter: "blur(18px)",
        borderRadius: 200, padding: "28px 56px",
        display: "flex", alignItems: "center", gap: 52,
        boxShadow: "0 20px 60px rgba(124,58,237,0.14)",
        border: "2px solid rgba(255,255,255,0.9)",
      }}>
        {AI_LOGOS.map((logo, i) => {
          const sc  = interpolate(logoSprings[i], [0, 1], [0.6, 1]);
          const lop = fi(f, 26 + i * 12, 40 + i * 12);
          return (
            <div key={i} style={{ opacity: lop, transform: `scale(${sc})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <logo.Logo size={50} />
              <span style={{ fontSize: 17, fontWeight: 600, fontFamily: sans, color: NAVY }}>{logo.name}</span>
            </div>
          );
        })}
      </div>

      {/* CTA teaser */}
      <div style={{ ...slideIn(f, 105, 22), textAlign: "center" }}>
        <span style={{ fontSize: 34, fontFamily: serif, fontStyle: "italic", color: GRAY }}>
          Join the brands already appearing in AI answers.
        </span>
      </div>

      <Sub text="What if AI cited your brand in every relevant answer?" total={S6} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 7 — CTA  (875 – 1 040)
// ════════════════════════════════════════════════════════════════════════════
const S7 = 165;

const Scene7: React.FC = () => {
  const f  = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S7);

  const ctaSp   = spring({ frame: f - 32, fps, config: { damping: 18, stiffness: 85 } });
  const ctaSc   = interpolate(ctaSp, [0, 1], [0.82, 1]);
  const pulse   = 0.75 + Math.sin((f / 22) * Math.PI) * 0.25;
  const ctaFloat = floatY(f + 55, 4, 105);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: op }}>
      <Brand size="lg" from={0} />

      {/* Tagline */}
      <div style={{ ...slideIn(f, 22, 28), textAlign: "center", padding: "0 160px" }}>
        <span style={{ fontSize: 52, fontFamily: serif, fontWeight: 600, color: NAVY, lineHeight: 1.25 }}>
          Mention your{" "}
          <span style={{ color: PURPLE, position: "relative", display: "inline-block" }}>
            Brand
            <svg viewBox="0 0 200 18" style={{ position: "absolute", bottom: -8, left: -4, width: "calc(100% + 8px)", height: 18 }}>
              <path d="M4,14 Q50,4 100,11 Q150,18 196,7" fill="none" stroke={PURPLE} strokeWidth={4} strokeLinecap="round"
                strokeDasharray={220} strokeDashoffset={220 * (1 - fi(f, 30, 58))} opacity={0.85} />
            </svg>
          </span>{" "}
          on AI.
        </span>
      </div>

      {/* CTA button */}
      <div style={{ opacity: fi(f, 32, 50), transform: `scale(${ctaSc}) translateY(${ctaFloat}px)` }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          background: NAVY, borderRadius: 100, padding: "26px 68px",
          boxShadow: `0 0 ${32 * pulse}px ${12 * pulse}px rgba(124,58,237,0.26)`,
        }}>
          <span style={{ fontSize: 26 }}>📞</span>
          <span style={{ fontSize: 30, fontWeight: 700, fontFamily: sans, color: WHITE }}>Book a Free Call</span>
        </div>
      </div>

      <div style={{ opacity: fi(f, 58, 74), fontSize: 26, fontFamily: sans, color: GRAY_L }}>
        showyourbrand.app
      </div>

      {/* Social proof row */}
      <div style={{ opacity: fi(f, 80, 96), display: "flex", gap: 24 }}>
        {["40+ Brands", "4.9 ★", "10-minute audit", "No agency needed"].map((b, i) => (
          <div key={i} style={{
            fontSize: 20, fontFamily: sans, fontWeight: 600, color: GRAY,
            background: "rgba(255,255,255,0.78)", backdropFilter: "blur(10px)",
            borderRadius: 100, padding: "9px 24px",
            border: "1.5px solid rgba(255,255,255,0.9)",
            boxShadow: "0 4px 14px rgba(124,58,237,0.07)",
          }}>
            {b}
          </div>
        ))}
      </div>

      <Sub text="Book a free call. Get your GEO score. Appear on AI." total={S7} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 8 — Outro  (1 040 – 1 140)
// ════════════════════════════════════════════════════════════════════════════
const S8 = 100;

const Scene8: React.FC = () => {
  const f  = useCurrentFrame();
  const op = sceneOp(f, S8);
  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, opacity: op }}>
      <Brand size="lg" from={0} />
      <div style={{ ...slideIn(f, 22, 26), textAlign: "center" }}>
        <span style={{ fontSize: 44, fontFamily: serif, fontWeight: 600, color: NAVY, letterSpacing: -0.5 }}>
          Mention your <span style={{ color: PURPLE }}>Brand</span> on AI
        </span>
      </div>
      <div style={{ opacity: fi(f, 44, 58), fontSize: 26, fontFamily: sans, color: GRAY_L }}>
        showyourbrand.app
      </div>
      <Sub text="ShowYourBrand. Mention your Brand on AI." total={S8} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Root composition — 1 140 frames = 38 s @ 30 fps
// ════════════════════════════════════════════════════════════════════════════
export const SYBVideo_TextReveal: React.FC = () => (
  <AbsoluteFill>
    <BG />
    <Sequence from={0}    durationInFrames={155}><Scene1 /></Sequence>
    <Sequence from={140}  durationInFrames={160}><Scene2 /></Sequence>
    <Sequence from={285}  durationInFrames={165}><Scene3 /></Sequence>
    <Sequence from={435}  durationInFrames={155}><Scene4 /></Sequence>
    <Sequence from={575}  durationInFrames={155}><Scene5 /></Sequence>
    <Sequence from={725}  durationInFrames={155}><Scene6 /></Sequence>
    <Sequence from={875}  durationInFrames={165}><Scene7 /></Sequence>
    <Sequence from={1040} durationInFrames={100}><Scene8 /></Sequence>
  </AbsoluteFill>
);
