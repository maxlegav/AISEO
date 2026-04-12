/**
 * SYBVideo_Neon — Portrait 1080 × 1920  |  36 s @ 30 fps = 1 080 frames
 *
 * Narrative arc (English, voiceover subtitles):
 *  1. Hook        – "Is your brand even on AI?" (typing)
 *  2. Problem     – "Your competitors are already there"
 *  3. Intro       – Meet ShowYourBrand
 *  4. How         – Audit → Score → Action plan
 *  5. Platforms   – ChatGPT · Claude · Gemini · Perplexity · Grok
 *  6. Results     – Score 0→87, live mentions
 *  7. CTA         – Book a free call
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

// ── Palette (brand) ───────────────────────────────────────────────────────────
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
const easeOut  = Easing.out(Easing.cubic);
const easeInOut = Easing.inOut(Easing.cubic);
const FADE = 14;

const slideIn = (f: number, start: number, dy = 30) => ({
  opacity:    fi(f, start, start + 16),
  transform: `translateY(${interpolate(f, [start, start + 18], [dy, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut })}px)`,
});
const sceneOp = (f: number, total: number) =>
  Math.min(
    fi(f, 0, FADE) * interpolate(f, [0, FADE], [0.96, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    fi(f, total - FADE, total, 1, 0),
  );
const floatY = (f: number, amp = 5, period = 120) =>
  Math.sin((f / period) * Math.PI * 2) * amp;

// ── Shared background  (always the same pastel gradient) ─────────────────────
const BG: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg,#C4B5FD 0%,#E9D5FF 28%,#FBCFE8 62%,#FED7AA 100%)" }}>
      {([
        { x: -120, y: 300,  s: 900, c: "rgba(196,181,253,0.42)", ph: 0   },
        { x: 1180, y: 1600, s: 800, c: "rgba(251,207,232,0.34)", ph: 45  },
        { x:  540, y:  -80, s: 700, c: "rgba(253,230,138,0.22)", ph: 22  },
        { x:  100, y: 1920, s: 600, c: "rgba(196,181,253,0.18)", ph: 80  },
      ] as const).map((b, i) => (
        <div key={i} style={{
          position: "absolute",
          left: b.x,
          top: b.y + Math.sin(((f + b.ph) / 130) * Math.PI * 2) * 22,
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
  const y  = interpolate(f, [10, 22], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  return (
    <div style={{ position: "absolute", bottom: 88, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        transform: `translateY(${y}px)`,
        background: "rgba(15,23,42,0.74)", backdropFilter: "blur(12px)",
        borderRadius: 100, padding: "15px 44px",
        fontSize: 27, fontFamily: sans, color: WHITE,
        textAlign: "center", maxWidth: 920,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
      }}>
        {text}
      </div>
    </div>
  );
};

// ── Brand badge (logo + "ShowYourBrand" always in black) ─────────────────────
const Brand: React.FC<{ size?: "sm" | "md" | "lg"; from?: number }> = ({ size = "md", from = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: f - from, fps, config: { damping: 18, stiffness: 68 } });
  const sizes = {
    sm: { logo: 52,  name: 36, sub: 13, pad: "12px 34px 12px 12px", gap: 14 },
    md: { logo: 80,  name: 52, sub: 16, pad: "18px 48px 18px 18px", gap: 20 },
    lg: { logo: 112, name: 68, sub: 18, pad: "22px 62px 22px 22px", gap: 26 },
  };
  const s = sizes[size];
  return (
    <div style={{
      opacity: fi(f, from, from + 18),
      transform: `scale(${interpolate(sp, [0,1],[0.65,1])}) translateY(${floatY(f, 5, 115)}px)`,
      display: "flex", alignItems: "center", gap: s.gap,
      background: "rgba(255,255,255,0.90)", backdropFilter: "blur(18px)",
      borderRadius: 200, padding: s.pad,
      boxShadow: "0 18px 58px rgba(124,58,237,0.18)", border: "2px solid rgba(255,255,255,0.9)",
    }}>
      <Img src={staticFile("logopdp.jpg")} style={{
        width: s.logo, height: s.logo, borderRadius: "50%", objectFit: "cover",
        boxShadow: "0 4px 18px rgba(124,58,237,0.22)", flexShrink: 0,
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: s.name, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -0.5, lineHeight: 1 }}>ShowYourBrand</span>
        <span style={{ fontSize: s.sub, fontFamily: sans, color: GRAY_L, letterSpacing: 1.6, textTransform: "uppercase" }}>Generative Engine Optimization</span>
      </div>
    </div>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 1 — Hook : "Is your brand even on AI?" (0 – 160)
// ════════════════════════════════════════════════════════════════════════════
const QUERY = "Best tool for [my category]?";
const S1 = 160;

const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S1);
  const chars  = Math.floor(fi(f, 18, 100, 0, QUERY.length));
  const cursor = chars < QUERY.length;
  const cardSp = spring({ frame: f, fps, config: { damping: 22, stiffness: 78 } });
  const cardY  = interpolate(cardSp, [0, 1], [50, 0]);
  const glowPct = fi(f, 108, 128);
  const suggestOp = fi(f, 88, 105);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 32, opacity: op }}>
      {/* Label */}
      <div style={{ ...slideIn(f, 6, 20), fontSize: 24, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        The new search engine
      </div>

      {/* Search card */}
      <div style={{
        transform: `translateY(${cardY}px)`,
        width: 840, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(18px)",
        borderRadius: 100, padding: "26px 36px",
        display: "flex", alignItems: "center", gap: 20,
        border: `1.5px solid rgba(124,58,237,${0.14 + glowPct * 0.22})`,
        boxShadow: `0 0 ${40 * glowPct}px rgba(124,58,237,${0.22 * glowPct}), 0 8px 40px rgba(124,58,237,0.10)`,
      }}>
        <svg width={28} height={28} viewBox="0 0 24 24" fill="none">
          <circle cx={11} cy={11} r={8} stroke={GRAY_L} strokeWidth={2} />
          <path d="M21 21l-4.35-4.35" stroke={GRAY_L} strokeWidth={2} strokeLinecap="round" />
        </svg>
        <span style={{ flex: 1, fontSize: 30, fontFamily: sans, color: NAVY, lineHeight: 1.2 }}>
          {QUERY.slice(0, chars)}
          {cursor && <span style={{ display: "inline-block", width: 2.5, height: "0.9em", background: PURPLE, marginLeft: 3, verticalAlign: "text-bottom", opacity: Math.floor(f / 7) % 2 === 0 ? 1 : 0 }} />}
        </span>
        <div style={{
          width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
          background: chars === QUERY.length ? `rgba(124,58,237,${0.55 + glowPct * 0.45})` : "#F1F5F9",
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.3s",
          boxShadow: glowPct > 0.1 ? `0 0 18px rgba(124,58,237,${glowPct * 0.8})` : "none",
        }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <path d="M12 4l8 8-8 8M20 12H4" stroke={chars === QUERY.length ? WHITE : GRAY_L} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>

      {/* AI competitor response cards */}
      <div style={{ opacity: suggestOp, display: "flex", flexDirection: "column", gap: 12, width: 840 }}>
        <div style={{ fontSize: 21, fontFamily: sans, color: GRAY_L, fontWeight: 600, marginLeft: 6, marginBottom: 4 }}>
          ChatGPT says:
        </div>
        {[
          { name: "Competitor A",  found: true  },
          { name: "Competitor B",  found: true  },
          { name: "Your Brand",    found: false },
        ].map((item, i) => (
          <div key={i} style={{
            opacity: fi(f, 90 + i * 9, 106 + i * 9),
            transform: `translateY(${interpolate(f, [90 + i * 9, 108 + i * 9], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut })}px)`,
            background: item.found ? "rgba(255,255,255,0.82)" : "rgba(254,242,242,0.90)",
            backdropFilter: "blur(12px)",
            borderRadius: 18, padding: "18px 30px",
            display: "flex", alignItems: "center", gap: 18,
            border: `1.5px solid ${item.found ? "rgba(255,255,255,0.9)" : "rgba(239,68,68,0.28)"}`,
            boxShadow: item.found ? "0 4px 16px rgba(16,185,129,0.09)" : "0 4px 16px rgba(239,68,68,0.10)",
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: "50%", flexShrink: 0,
              background: item.found ? "#ECFDF5" : "#FEF2F2",
              border: `1.5px solid ${item.found ? "#A7F3D0" : "#FECACA"}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {item.found
                ? <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={GREEN} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg width={16} height={16} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth={2.8} strokeLinecap="round" /></svg>
              }
            </div>
            <span style={{ flex: 1, fontSize: 28, fontFamily: sans, fontWeight: 700, color: item.found ? NAVY : "#EF4444" }}>
              {item.name}
            </span>
            <span style={{
              fontSize: 22, fontWeight: 700, fontFamily: sans,
              color: item.found ? GREEN : "#EF4444",
              background: item.found ? "#ECFDF5" : "#FEF2F2",
              borderRadius: 100, padding: "6px 20px",
              border: `1px solid ${item.found ? "#A7F3D0" : "#FECACA"}`,
            }}>
              {item.found ? "Cited ✓" : "Not found ✗"}
            </span>
          </div>
        ))}
      </div>

      <Sub text="Every day, millions ask AI for brand recommendations…" total={S1} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 2 — Problem : "Your competitors are there. You're not." (145 – 310)
// ════════════════════════════════════════════════════════════════════════════
const S2 = 165;

const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S2);

  const titleSp  = spring({ frame: f - 6,  fps, config: { damping: 13, stiffness: 120 } });
  const titleSp2 = spring({ frame: f - 18, fps, config: { damping: 13, stiffness: 120 } });
  const card1Sp  = spring({ frame: f - 38, fps, config: { damping: 14, stiffness: 108 } });
  const card2Sp  = spring({ frame: f - 56, fps, config: { damping: 14, stiffness: 108 } });

  const titleY1 = interpolate(titleSp,  [0, 1], [44, 0]);
  const titleY2 = interpolate(titleSp2, [0, 1], [44, 0]);
  const card1X  = interpolate(card1Sp,  [0, 1], [-100, 0]);
  const card2X  = interpolate(card2Sp,  [0, 1], [100, 0]);
  const card1Sc = interpolate(card1Sp,  [0, 1], [0.88, 1]);
  const card2Sc = interpolate(card2Sp,  [0, 1], [0.88, 1]);

  const line2 = slideIn(f, 88, 24);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, opacity: op, padding: "0 80px" }}>
      {/* Big headline */}
      <div style={{ textAlign: "center" }}>
        <div style={{ opacity: fi(f, 6, 20), transform: `translateY(${titleY1}px)`, fontSize: 96, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -2.5, lineHeight: 1 }}>
          Your competitors
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20, justifyContent: "center", marginTop: 10 }}>
          <span style={{ opacity: fi(f, 18, 32), transform: `translateY(${titleY2}px)`, display: "inline-block", fontSize: 96, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -2.5 }}>are</span>
          <span style={{
            opacity: fi(f, 22, 36), transform: `translateY(${titleY2}px) scale(${interpolate(titleSp2,[0,1],[0.8,1])})`,
            display: "inline-block",
            fontSize: 96, fontWeight: 800, fontFamily: sans, color: WHITE,
            background: PURPLE, borderRadius: 22, padding: "2px 28px", lineHeight: 1.15,
          }}>
            already there.
          </span>
        </div>
      </div>

      {/* Comparison cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18, width: "100%", marginTop: 8 }}>
        {/* Competitor ✓ — slides from left */}
        <div style={{
          opacity: fi(f, 38, 54), transform: `translateX(${card1X}px) scale(${card1Sc})`,
          background: "rgba(255,255,255,0.84)", backdropFilter: "blur(14px)",
          borderRadius: 22, padding: "24px 36px",
          display: "flex", alignItems: "center", gap: 20,
          border: "1.5px solid rgba(255,255,255,0.9)",
          boxShadow: "0 8px 28px rgba(16,185,129,0.12)",
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#ECFDF5", border: "1.5px solid #A7F3D0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none"><path d="M20 6L9 17l-5-5" stroke={GREEN} strokeWidth={2.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
          </div>
          <span style={{ fontSize: 30, fontFamily: sans, color: NAVY, flex: 1 }}>
            <span style={{ fontWeight: 800 }}>Competitor Brand</span> — cited by ChatGPT
          </span>
          <div style={{ fontSize: 24, fontFamily: sans, fontWeight: 700, color: GREEN, background: "#ECFDF5", borderRadius: 100, padding: "8px 22px", border: "1px solid #A7F3D0" }}>Visible ✓</div>
        </div>

        {/* Your brand ✗ — slides from right */}
        <div style={{
          opacity: fi(f, 56, 72), transform: `translateX(${card2X}px) scale(${card2Sc})`,
          background: "rgba(254,242,242,0.88)", backdropFilter: "blur(14px)",
          borderRadius: 22, padding: "24px 36px",
          display: "flex", alignItems: "center", gap: 20,
          border: "1.5px solid rgba(239,68,68,0.28)",
          boxShadow: "0 8px 28px rgba(239,68,68,0.10)",
        }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "#FEF2F2", border: "1.5px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth={2.8} strokeLinecap="round" /></svg>
          </div>
          <span style={{ fontSize: 30, fontFamily: sans, color: "#EF4444", flex: 1 }}>
            <span style={{ fontWeight: 800 }}>Your Brand</span> — not mentioned
          </span>
          <div style={{ fontSize: 24, fontFamily: sans, fontWeight: 700, color: "#EF4444", background: "#FEF2F2", borderRadius: 100, padding: "8px 22px", border: "1px solid #FECACA" }}>Invisible ✗</div>
        </div>
      </div>

      {/* Tag */}
      <div style={{ ...line2, fontSize: 38, fontFamily: serif, fontStyle: "italic", color: GRAY, textAlign: "center" }}>
        72% of AI answers don't include your brand.
      </div>

      <Sub text="While you sleep, AI is recommending your competitors." total={S2} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 3 — Intro : Meet ShowYourBrand (295 – 450)
// ════════════════════════════════════════════════════════════════════════════
const S3 = 155;

const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const op = sceneOp(f, S3);
  const taglineSlide = slideIn(f, 30, 26);
  const subSlide     = slideIn(f, 48, 22);
  const pillsOp      = fi(f, 65, 82);

  const pills = [
    { icon: "⚡", label: "100 AI prompts tested" },
    { icon: "📊", label: "GEO Score 0–100" },
    { icon: "🏆", label: "Competitor analysis" },
    { icon: "🗺️", label: "Action plan" },
  ];
  const { fps } = useVideoConfig();
  const pillSprings = pills.map((_, i) =>
    spring({ frame: f - (68 + i * 10), fps, config: { damping: 20, stiffness: 90 } })
  );

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: op }}>
      <Brand size="lg" from={0} />

      <div style={{ ...taglineSlide, textAlign: "center", padding: "0 80px" }}>
        <span style={{ fontSize: 56, fontFamily: serif, fontWeight: 600, color: NAVY, lineHeight: 1.2 }}>
          The first platform to make your{" "}
          <span style={{ color: PURPLE }}>Brand</span>{" "}visible on AI.
        </span>
      </div>

      <div style={{ ...subSlide, fontSize: 30, fontFamily: sans, color: GRAY, textAlign: "center" }}>
        Audit · Score · Optimize · Repeat
      </div>

      {/* Feature pills */}
      <div style={{ opacity: pillsOp, display: "flex", flexDirection: "column", gap: 16, width: "100%", padding: "0 80px" }}>
        {pills.map((p, i) => {
          const sc  = interpolate(pillSprings[i], [0, 1], [0.85, 1]);
          const pop = fi(f, 68 + i * 10, 82 + i * 10);
          return (
            <div key={i} style={{
              opacity: pop, transform: `scale(${sc})`,
              background: "rgba(255,255,255,0.78)", backdropFilter: "blur(12px)",
              borderRadius: 18, padding: "18px 32px",
              display: "flex", alignItems: "center", gap: 18,
              border: "1.5px solid rgba(255,255,255,0.9)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.08)",
            }}>
              <span style={{ fontSize: 30 }}>{p.icon}</span>
              <span style={{ fontSize: 26, fontFamily: sans, color: NAVY, fontWeight: 600 }}>{p.label}</span>
              <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
            </div>
          );
        })}
      </div>

      <Sub text="Meet ShowYourBrand — the first AI visibility platform for brands." total={S3} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 4 — How it works : 3 steps (435 – 580)
// ════════════════════════════════════════════════════════════════════════════
const S4 = 145;

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S4);

  const steps = [
    { n: "01", icon: "🔍", title: "Audit",       desc: "We test 100 AI prompts about your brand & category",   color: PURPLE,  delay: 8  },
    { n: "02", icon: "📊", title: "Score",        desc: "You get a GEO score from 0 to 100 per AI model",       color: TEAL,    delay: 32 },
    { n: "03", icon: "⚡", title: "Action Plan",  desc: "Follow a prioritized roadmap to climb AI rankings",    color: "#F59E0B", delay: 56 },
  ];

  const springs = steps.map(s => spring({ frame: f - s.delay, fps, config: { damping: 20, stiffness: 76 } }));

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: op }}>
      <div style={{ ...slideIn(f, 4, 24), fontSize: 28, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        How it works
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 24, width: "100%", padding: "0 80px" }}>
        {steps.map((step, i) => {
          const sc = interpolate(springs[i], [0, 1], [0.82, 1]);
          const tx = interpolate(springs[i], [0, 1], [-60, 0]);
          const sop = fi(f, step.delay, step.delay + 16);
          return (
            <div key={i} style={{
              opacity: sop, transform: `translateX(${tx}px) scale(${sc})`,
              background: "rgba(255,255,255,0.82)", backdropFilter: "blur(16px)",
              borderRadius: 24, padding: "26px 36px",
              display: "flex", alignItems: "center", gap: 24,
              border: "1.5px solid rgba(255,255,255,0.9)",
              boxShadow: "0 8px 30px rgba(124,58,237,0.10)",
            }}>
              <div style={{
                minWidth: 64, height: 64, borderRadius: 18,
                background: `${step.color}18`, border: `1.5px solid ${step.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <span style={{ fontSize: 32 }}>{step.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontFamily: sans, fontWeight: 700, color: step.color, letterSpacing: 1.5 }}>{step.n}</span>
                  <span style={{ fontSize: 30, fontWeight: 700, fontFamily: sans, color: NAVY }}>{step.title}</span>
                </div>
                <span style={{ fontSize: 22, fontFamily: sans, color: GRAY, lineHeight: 1.4 }}>{step.desc}</span>
              </div>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: step.color, flexShrink: 0 }} />
            </div>
          );
        })}
      </div>

      <Sub text="Audit 100 prompts. Get your GEO score. Follow your action plan." total={S4} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 5 — Platforms : "Be mentioned by" (575 – 720)
// ════════════════════════════════════════════════════════════════════════════
const S5 = 145;
const AI_LOGOS = [
  { name: "ChatGPT",    Logo: OpenAILogo     },
  { name: "Claude",     Logo: ClaudeLogo     },
  { name: "Perplexity", Logo: PerplexityLogo },
  { name: "Gemini",     Logo: GeminiLogo     },
  { name: "Grok",       Logo: GrokLogo       },
];

const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S5);
  const cardFloat = floatY(f, 5, 115);
  const cardSp    = spring({ frame: f, fps, config: { damping: 22, stiffness: 75 } });
  const cardY     = interpolate(cardSp, [0, 1], [44, 0]);
  const labelOp   = slideIn(f, 6, 22).opacity;

  const logoSprings = AI_LOGOS.map((_, i) =>
    spring({ frame: f - (22 + i * 11), fps, config: { damping: 18, stiffness: 95 } })
  );

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: op }}>
      <div style={{ opacity: labelOp, fontSize: 28, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        Be mentioned by
      </div>

      {/* Logo pill */}
      <div style={{
        transform: `translateY(${cardY + cardFloat}px)`,
        background: "rgba(255,255,255,0.86)", backdropFilter: "blur(18px)",
        borderRadius: 200, padding: "32px 52px",
        display: "flex", alignItems: "center", gap: 40,
        boxShadow: "0 20px 60px rgba(124,58,237,0.14)",
        border: "2px solid rgba(255,255,255,0.9)",
      }}>
        {AI_LOGOS.map((logo, i) => {
          const sc = interpolate(logoSprings[i], [0, 1], [0.6, 1]);
          const lop = fi(f, 22 + i * 11, 36 + i * 11);
          return (
            <div key={i} style={{ opacity: lop, transform: `scale(${sc})`, display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
              <logo.Logo size={52} />
              <span style={{ fontSize: 18, fontWeight: 600, fontFamily: sans, color: NAVY }}>{logo.name}</span>
            </div>
          );
        })}
      </div>

      {/* Stat pill */}
      <div style={{
        ...slideIn(f, 105, 22),
        background: "rgba(255,255,255,0.78)", backdropFilter: "blur(12px)",
        borderRadius: 100, padding: "16px 44px",
        border: "1.5px solid rgba(255,255,255,0.9)",
        boxShadow: "0 6px 24px rgba(124,58,237,0.10)",
      }}>
        <span style={{ fontSize: 26, fontFamily: sans, color: NAVY }}>
          <span style={{ fontWeight: 700, color: PURPLE }}>100+</span> AI prompts tested per audit
        </span>
      </div>

      <Sub text="Track your visibility across ChatGPT, Claude, Gemini, Perplexity & Grok." total={S5} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 6 — Results : Score gauge (715 – 875)
// ════════════════════════════════════════════════════════════════════════════
const S6 = 160;

const Scene6: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S6);
  const score = Math.round(fi(f, 8, 30, 0, 87));
  const arc   = score / 100;
  const cardSp = spring({ frame: f, fps, config: { damping: 22, stiffness: 72 } });
  const cardY  = interpolate(cardSp, [0, 1], [40, 0]);
  const fl     = floatY(f, 5, 115);

  const rows = [
    { name: "ChatGPT",    val: 449, delta: "+18", color: "#10A37F" },
    { name: "Claude",     val: 312, delta: "+9",  color: "#D97706" },
    { name: "Perplexity", val: 198, delta: "+24", color: "#6366F1" },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: op }}>
      <div style={{ transform: `translateY(${cardY + fl}px) scale(1.1)` }}>
        <div style={{
          width: 920, background: "rgba(255,255,255,0.88)", backdropFilter: "blur(20px)",
          borderRadius: 32, overflow: "hidden",
          boxShadow: "0 28px 80px rgba(124,58,237,0.15)",
          border: "1.5px solid rgba(255,255,255,0.9)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "22px 36px 18px", borderBottom: "1px solid #F1F5F9", opacity: fi(f, 4, 18) }}>
            <Img src={staticFile("logopdp.jpg")} style={{ width: 42, height: 42, borderRadius: 10, objectFit: "cover" }} />
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: sans, color: NAVY }}>ShowYourBrand</span>
            <div style={{ marginLeft: "auto", fontSize: 14, fontFamily: sans, color: GRAY_L, background: "#F1F5F9", borderRadius: 100, padding: "5px 14px" }}>AI Visibility</div>
          </div>

          {/* Gauge */}
          <div style={{ padding: "28px 36px 0", display: "flex", justifyContent: "center" }}>
            <svg width={500} height={280} viewBox="0 0 500 280">
              <defs>
                <linearGradient id="gn" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#C4B5FD" />
                  <stop offset="50%" stopColor={TEAL} />
                  <stop offset="100%" stopColor={GREEN} />
                </linearGradient>
              </defs>
              <path d="M50,260 A200,200 0 0 1 450,260" fill="none" stroke="#E2E8F0" strokeWidth={26} strokeLinecap="round" />
              <path d="M50,260 A200,200 0 0 1 450,260" fill="none" stroke="url(#gn)" strokeWidth={26} strokeLinecap="round"
                strokeDasharray={Math.PI * 200} strokeDashoffset={Math.PI * 200 * (1 - arc)} />
              {score > 0 && (() => {
                const a2 = Math.PI - arc * Math.PI;
                return <circle cx={250 + 200 * Math.cos(a2)} cy={260 - 200 * Math.sin(a2)} r={13} fill={TEAL} stroke={WHITE} strokeWidth={4} />;
              })()}
              <text x={250} y={228} textAnchor="middle" fontSize={100} fontWeight={800} fontFamily={sans} fill={NAVY}>{score}</text>
              <text x={250} y={272} textAnchor="middle" fontSize={26} fontFamily={sans} fill={GRAY_L}>/100</text>
            </svg>
          </div>

          {/* Status badge */}
          <div style={{ display: "flex", justifyContent: "center", marginTop: -12, opacity: fi(f, 92, 108) }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "#ECFDF5", borderRadius: 100, padding: "10px 28px", border: "1px solid #A7F3D0" }}>
              <div style={{ width: 10, height: 10, borderRadius: "50%", background: TEAL }} />
              <span style={{ fontSize: 22, fontWeight: 700, fontFamily: sans, color: "#065F46" }}>Excellent — Top 5%</span>
            </div>
          </div>

          {/* Rows */}
          <div style={{ padding: "18px 36px 22px", borderTop: "1px solid #F1F5F9", marginTop: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((r, i) => {
              const rop = fi(f, 98 + i * 10, 112 + i * 10);
              const rx  = interpolate(f, [98 + i * 10, 114 + i * 10], [22, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
              return (
                <div key={i} style={{ opacity: rop, transform: `translateX(${rx}px)`, display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: r.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: r.color }} />
                  </div>
                  <span style={{ flex: 1, fontSize: 20, fontFamily: sans, color: NAVY }}>{r.name}</span>
                  <span style={{ fontSize: 20, fontWeight: 700, fontFamily: sans, color: NAVY }}>{r.val}</span>
                  <span style={{ fontSize: 18, fontWeight: 600, color: GREEN, background: "#ECFDF5", borderRadius: 100, padding: "3px 12px" }}>{r.delta}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Sub text="Our users achieve an average GEO score of 87 out of 100." total={S6} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// SCENE 7 — CTA (870 – 1 080)
// ════════════════════════════════════════════════════════════════════════════
const S7 = 210;

const Scene7: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S7);
  const ctaSp = spring({ frame: f - 32, fps, config: { damping: 18, stiffness: 85 } });
  const ctaSc = interpolate(ctaSp, [0, 1], [0.82, 1]);
  const pulse = 0.75 + Math.sin((f / 22) * Math.PI) * 0.25;

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 44, opacity: op }}>
      <Brand size="lg" from={0} />

      {/* Tagline */}
      <div style={{ ...slideIn(f, 22, 28), textAlign: "center", padding: "0 80px" }}>
        <span style={{ fontSize: 56, fontFamily: serif, fontWeight: 600, color: NAVY, lineHeight: 1.25 }}>
          Mention your{" "}
          <span style={{ color: PURPLE, position: "relative", display: "inline-block" }}>
            Brand
            <svg viewBox="0 0 220 18" style={{ position: "absolute", bottom: -8, left: -6, width: "calc(100% + 12px)", height: 18 }}>
              <path d="M4,14 Q55,4 110,11 Q165,18 216,7" fill="none" stroke={PURPLE} strokeWidth={4} strokeLinecap="round" opacity={fi(f, 30, 55)} />
            </svg>
          </span>{" "}
          on AI.
        </span>
      </div>

      {/* CTA button */}
      <div style={{
        opacity: fi(f, 32, 50), transform: `scale(${ctaSc}) translateY(${floatY(f + 55, 5, 105)}px)`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          background: NAVY, borderRadius: 100, padding: "28px 72px",
          boxShadow: `0 0 ${32 * pulse}px ${12 * pulse}px rgba(124,58,237,0.26)`,
        }}>
          <span style={{ fontSize: 28 }}>📞</span>
          <span style={{ fontSize: 32, fontWeight: 700, fontFamily: sans, color: WHITE }}>Book a Demo · Subscribe Now</span>
        </div>
      </div>

      <div style={{ opacity: fi(f, 58, 74), fontSize: 28, fontFamily: sans, color: GRAY_L }}>
        showyourbrand.app
      </div>

      <Sub text="Book a demo. Get your GEO score. Appear on AI." total={S7} />
    </AbsoluteFill>
  );
};

// ════════════════════════════════════════════════════════════════════════════
// Root composition — 1 080 frames = 36 s @ 30 fps
// ════════════════════════════════════════════════════════════════════════════
export const SYBVideo_Neon: React.FC = () => (
  <AbsoluteFill>
    <BG />
    <Sequence from={0}   durationInFrames={160}><Scene1 /></Sequence>
    <Sequence from={145} durationInFrames={165}><Scene2 /></Sequence>
    <Sequence from={295} durationInFrames={155}><Scene3 /></Sequence>
    <Sequence from={435} durationInFrames={145}><Scene4 /></Sequence>
    <Sequence from={575} durationInFrames={145}><Scene5 /></Sequence>
    <Sequence from={715} durationInFrames={160}><Scene6 /></Sequence>
    <Sequence from={870} durationInFrames={210}><Scene7 /></Sequence>
  </AbsoluteFill>
);
