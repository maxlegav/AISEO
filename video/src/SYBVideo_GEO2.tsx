/**
 * SYBVideo_GEO2 — "The Citation Gap"
 * 1080 × 1080  |  20 s @ 30 fps = 600 frames
 * Format: Square — Instagram feed · LinkedIn · Twitter/X
 *
 * Concept: Results-first, metric-heavy proof.
 * No futurism — just concrete numbers and a sharp before/after.
 *
 * Scene 1 (0–120)    The Search    — someone just searched on ChatGPT, AI answer appears
 * Scene 2 (105–240)  The Gap       — 5 competitors cited, your brand: 0 mentions
 * Scene 3 (225–390)  The Fix       — ShowYourBrand GEO Score 0→87 in seconds
 * Scene 4 (375–510)  The Results   — +340% AI citations in 30 days, big animated bar
 * Scene 5 (495–600)  CTA           — Logo · "Book a Demo · Subscribe Now" · URL
 */
import React from "react";
import {
  AbsoluteFill, interpolate, spring,
  useCurrentFrame, useVideoConfig,
  Sequence, Easing, staticFile, Img,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";

// ── Fonts ──────────────────────────────────────────────────────────────────
const { fontFamily: sans } = loadInter("normal", {
  weights: ["400","500","600","700","800","900"],
  subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});
const { fontFamily: serif } = loadCormorant("normal", {
  weights: ["600","700"], subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});

// ── Palette ────────────────────────────────────────────────────────────────
const NAVY   = "#1E293B";
const GRAY   = "#64748B";
const GRAY_L = "#94A3B8";
const PURPLE = "#7C3AED";
const WHITE  = "#FFFFFF";
const TEAL   = "#14B8A6";
const GREEN  = "#10B981";
const AMBER  = "#F59E0B";

// ── Helpers ────────────────────────────────────────────────────────────────
const fi = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
const easeOut  = Easing.out(Easing.cubic);
const easeBack = Easing.out(Easing.back(1.3));
const FADE = 14;

const sceneOp = (f: number, total: number) =>
  Math.min(fi(f, 0, FADE), fi(f, total - FADE, total, 1, 0));

const slideUp = (f: number, start: number, dy = 28) => ({
  opacity:   fi(f, start, start + 14),
  transform: `translateY(${interpolate(f, [start, start + 16], [dy, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut })}px)`,
});

const floatY = (f: number, amp = 4, period = 120) =>
  Math.sin((f / period) * Math.PI * 2) * amp;

// ── Shared BG ──────────────────────────────────────────────────────────────
const BG: React.FC = () => {
  const f = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "linear-gradient(135deg,#C4B5FD 0%,#E9D5FF 28%,#FBCFE8 62%,#FED7AA 100%)" }}>
      {([
        { x: -100, y: 200,  s: 800, c: "rgba(196,181,253,0.42)", ph: 0  },
        { x: 1180, y: 900,  s: 700, c: "rgba(251,207,232,0.34)", ph: 40 },
        { x:  540, y: -60,  s: 600, c: "rgba(253,230,138,0.22)", ph: 20 },
        { x:  100, y: 1080, s: 500, c: "rgba(196,181,253,0.18)", ph: 75 },
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

// ── Subtitle bar ───────────────────────────────────────────────────────────
const Sub: React.FC<{ text: string; total: number }> = ({ text, total }) => {
  const f  = useCurrentFrame();
  const op = Math.min(fi(f, 10, 22), fi(f, total - 12, total, 1, 0));
  const y  = interpolate(f, [10, 22], [12, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: easeOut });
  return (
    <div style={{ position: "absolute", bottom: 56, left: 0, right: 0, display: "flex", justifyContent: "center", opacity: op }}>
      <div style={{
        transform: `translateY(${y}px)`,
        background: "rgba(15,23,42,0.74)", backdropFilter: "blur(12px)",
        borderRadius: 100, padding: "14px 44px",
        fontSize: 26, fontFamily: sans, color: WHITE,
        textAlign: "center", maxWidth: 920,
        border: "1px solid rgba(255,255,255,0.14)",
        boxShadow: "0 8px 24px rgba(0,0,0,0.22)",
      }}>
        {text}
      </div>
    </div>
  );
};

// ── Brand badge ────────────────────────────────────────────────────────────
const Brand: React.FC<{ size?: "sm" | "md" | "lg"; from?: number }> = ({ size = "md", from = 0 }) => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const sp = spring({ frame: f - from, fps, config: { damping: 18, stiffness: 68 } });
  const sizes = {
    sm: { logo: 52,  name: 34, sub: 13, pad: "12px 36px 12px 12px", gap: 14 },
    md: { logo: 72,  name: 46, sub: 15, pad: "18px 48px 18px 18px", gap: 20 },
    lg: { logo: 100, name: 60, sub: 17, pad: "22px 60px 22px 22px", gap: 24 },
  };
  const s = sizes[size];
  return (
    <div style={{
      opacity: fi(f, from, from + 18),
      transform: `scale(${interpolate(sp, [0, 1], [0.65, 1])}) translateY(${floatY(f, 4, 115)}px)`,
      display: "flex", alignItems: "center", gap: s.gap,
      background: "rgba(255,255,255,0.92)", backdropFilter: "blur(18px)",
      borderRadius: 200, padding: s.pad,
      boxShadow: "0 18px 58px rgba(124,58,237,0.18)",
      border: "2px solid rgba(255,255,255,0.9)",
    }}>
      <Img src={staticFile("logopdp.jpg")} style={{
        width: s.logo, height: s.logo, borderRadius: "50%", objectFit: "cover",
        boxShadow: "0 4px 18px rgba(124,58,237,0.22)", flexShrink: 0,
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: s.name, fontWeight: 700, fontFamily: sans, color: NAVY, letterSpacing: -0.5, lineHeight: 1 }}>ShowYourBrand</span>
        <span style={{ fontSize: s.sub, fontFamily: sans, color: GRAY_L, letterSpacing: 1.5, textTransform: "uppercase" }}>Generative Engine Optimization</span>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 1 — The Search  (0–120)
// "Someone just asked ChatGPT about your category…"
// ══════════════════════════════════════════════════════════════════════════
const S1 = 120;
const TYPED = "best AI visibility tool for brands?";

const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S1);

  const labelSl = slideUp(f, 5, 20);

  // Typing
  const chars   = Math.floor(fi(f, 16, 80, 0, TYPED.length));
  const cursor  = chars < TYPED.length;

  // Card spring
  const cardSp  = spring({ frame: f - 8, fps, config: { damping: 20, stiffness: 80 } });
  const cardY   = interpolate(cardSp, [0, 1], [48, 0]);

  // Glow grows when typing complete
  const glowPct = fi(f, 82, 100);

  // Notification badge
  const notifOp = fi(f, 90, 104);
  const notifSp = spring({ frame: f - 90, fps, config: { damping: 16, stiffness: 100 } });
  const notifSc = interpolate(notifSp, [0, 1], [0.6, 1]);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 30, opacity: op }}>
      {/* Label */}
      <div style={{ ...labelSl, fontSize: 26, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        Right now, someone is asking:
      </div>

      {/* Chat search bar */}
      <div style={{
        transform: `translateY(${cardY}px)`,
        width: 820, background: "rgba(255,255,255,0.90)", backdropFilter: "blur(18px)",
        borderRadius: 22, padding: "28px 36px",
        border: `1.5px solid rgba(124,58,237,${0.14 + glowPct * 0.22})`,
        boxShadow: `0 0 ${40 * glowPct}px rgba(124,58,237,${0.18 * glowPct}), 0 12px 44px rgba(124,58,237,0.10)`,
      }}>
        {/* ChatGPT header */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#10A37F", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width={14} height={14} viewBox="0 0 24 24" fill="white">
              <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073z" />
            </svg>
          </div>
          <span style={{ fontSize: 20, fontFamily: sans, fontWeight: 600, color: GRAY }}>ChatGPT</span>
          <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: "#10A37F" }} />
        </div>

        {/* Typing text */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
          <svg width={22} height={22} viewBox="0 0 24 24" fill="none" style={{ marginTop: 3, flexShrink: 0 }}>
            <circle cx={11} cy={11} r={8} stroke={GRAY_L} strokeWidth={2} />
            <path d="M21 21l-4.35-4.35" stroke={GRAY_L} strokeWidth={2} strokeLinecap="round" />
          </svg>
          <span style={{ fontSize: 30, fontFamily: sans, color: NAVY, lineHeight: 1.3, flex: 1 }}>
            {TYPED.slice(0, chars)}
            {cursor && (
              <span style={{ display: "inline-block", width: 2.5, height: "0.88em", background: PURPLE, marginLeft: 3, verticalAlign: "text-bottom", opacity: Math.floor(f / 7) % 2 === 0 ? 1 : 0 }} />
            )}
          </span>
        </div>
      </div>

      {/* Notification badge */}
      <div style={{
        opacity: notifOp, transform: `scale(${notifSc})`,
        display: "flex", alignItems: "center", gap: 14,
        background: "rgba(255,255,255,0.84)", backdropFilter: "blur(12px)",
        borderRadius: 100, padding: "14px 36px",
        border: "1.5px solid rgba(124,58,237,0.16)",
        boxShadow: "0 8px 28px rgba(124,58,237,0.12)",
      }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: PURPLE, flexShrink: 0 }} />
        <span style={{ fontSize: 26, fontFamily: sans, color: NAVY }}>
          <span style={{ fontWeight: 700, color: PURPLE }}>1.2 billion</span> AI searches like this happen every day
        </span>
      </div>

      <Sub text="Every day, billions of AI searches determine which brands get recommended." total={S1} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 2 — The Gap  (105–240)
// "5 competitors cited. Your brand: 0 mentions."
// ══════════════════════════════════════════════════════════════════════════
const S2 = 135;

const COMPETITORS = [
  { name: "Brandly",    count: 18, color: "#10A37F" },
  { name: "VisibilityAI", count: 12, color: "#6366F1" },
  { name: "RankBrain Co.", count: 9,  color: "#F59E0B" },
];

const Scene2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S2);

  // Headline
  const titleSp = spring({ frame: f - 6, fps, config: { damping: 13, stiffness: 115 } });
  const titleY  = interpolate(titleSp, [0, 1], [44, 0]);
  const titleOp = fi(f, 6, 20);

  // Competitor springs (pre-computed, no map inside JSX)
  const cSp0 = spring({ frame: f - 28, fps, config: { damping: 14, stiffness: 105 } });
  const cSp1 = spring({ frame: f - 44, fps, config: { damping: 14, stiffness: 105 } });
  const cSp2 = spring({ frame: f - 60, fps, config: { damping: 14, stiffness: 105 } });
  const cSprings = [cSp0, cSp1, cSp2];

  // "Your brand" reveal
  const yourSp = spring({ frame: f - 80, fps, config: { damping: 12, stiffness: 130 } });
  const yourSc = interpolate(yourSp, [0, 1], [0.72, 1]);
  const yourOp = fi(f, 80, 96);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, opacity: op }}>
      {/* Headline */}
      <div style={{ textAlign: "center", opacity: titleOp, transform: `translateY(${titleY}px)` }}>
        <div style={{ fontSize: 44, fontWeight: 800, fontFamily: sans, color: NAVY, letterSpacing: -1.5, lineHeight: 1 }}>
          ChatGPT just answered.
        </div>
        <div style={{ fontSize: 32, fontFamily: sans, color: GRAY, marginTop: 6 }}>
          Here's who got cited:
        </div>
      </div>

      {/* Competitors */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, width: 820 }}>
        {COMPETITORS.map((c, i) => {
          const sp  = cSprings[i];
          const tx  = interpolate(sp, [0, 1], [-80, 0]);
          const sc  = interpolate(sp, [0, 1], [0.88, 1]);
          const pop = fi(f, 28 + i * 16, 44 + i * 16);
          const barW = fi(f, 44 + i * 16, 70 + i * 16, 0, (c.count / 20) * 100);
          return (
            <div key={i} style={{
              opacity: pop, transform: `translateX(${tx}px) scale(${sc})`,
              background: "rgba(255,255,255,0.84)", backdropFilter: "blur(14px)",
              borderRadius: 18, padding: "20px 28px",
              display: "flex", alignItems: "center", gap: 18,
              border: "1.5px solid rgba(255,255,255,0.9)",
              boxShadow: "0 6px 22px rgba(16,185,129,0.10)",
            }}>
              <div style={{ width: 38, height: 38, borderRadius: "50%", background: c.color + "22", border: `1.5px solid ${c.color}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: c.color }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
                  <span style={{ fontSize: 26, fontFamily: sans, fontWeight: 700, color: NAVY }}>{c.name}</span>
                  <span style={{ fontSize: 22, fontFamily: sans, fontWeight: 700, color: GREEN, background: "#ECFDF5", borderRadius: 100, padding: "4px 16px", border: "1px solid #A7F3D0" }}>
                    {c.count} mentions ✓
                  </span>
                </div>
                <div style={{ height: 6, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${barW}%`, background: `linear-gradient(90deg,${c.color},${c.color}aa)`, borderRadius: 100 }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Your brand — 0 mentions, big red */}
      <div style={{
        opacity: yourOp, transform: `scale(${yourSc})`,
        width: 820,
        background: "rgba(254,242,242,0.90)", backdropFilter: "blur(14px)",
        borderRadius: 20, padding: "22px 28px",
        display: "flex", alignItems: "center", gap: 18,
        border: "2px solid rgba(239,68,68,0.30)",
        boxShadow: "0 10px 30px rgba(239,68,68,0.12)",
      }}>
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#FEF2F2", border: "2px solid #FECACA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="#EF4444" strokeWidth={2.8} strokeLinecap="round" /></svg>
        </div>
        <div style={{ flex: 1 }}>
          <span style={{ fontSize: 28, fontFamily: sans, fontWeight: 800, color: "#EF4444" }}>Your Brand</span>
          <div style={{ fontSize: 22, fontFamily: sans, color: GRAY, marginTop: 3 }}>not cited — invisible to AI</div>
        </div>
        <span style={{ fontSize: 44, fontWeight: 900, fontFamily: sans, color: "#EF4444" }}>0</span>
      </div>

      <Sub text="Right now, your competitors are being recommended. You're not." total={S2} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 3 — The Fix  (225–390)
// ShowYourBrand GEO Score 0 → 87
// ══════════════════════════════════════════════════════════════════════════
const S3 = 165;

const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S3);

  // Brand badge spring
  const brandSp = spring({ frame: f, fps, config: { damping: 18, stiffness: 72 } });
  const brandY  = interpolate(brandSp, [0, 1], [40, 0]);
  const brandOp = fi(f, 0, 18);

  // Score counter — fast
  const score   = Math.round(fi(f, 22, 55, 0, 87));
  const arc     = score / 100;
  const scoreSp = spring({ frame: f - 18, fps, config: { damping: 22, stiffness: 72 } });
  const cardY   = interpolate(scoreSp, [0, 1], [50, 0]);
  const fl      = floatY(f, 4, 118);

  // Steps
  const stepSp0 = spring({ frame: f - 74, fps, config: { damping: 18, stiffness: 90 } });
  const stepSp1 = spring({ frame: f - 88, fps, config: { damping: 18, stiffness: 90 } });
  const stepSp2 = spring({ frame: f - 102, fps, config: { damping: 18, stiffness: 90 } });
  const stepSprings = [stepSp0, stepSp1, stepSp2];

  const steps = [
    { icon: "🔍", label: "100 AI prompts tested",      color: PURPLE  },
    { icon: "📊", label: "GEO Score per platform",     color: TEAL    },
    { icon: "⚡", label: "Prioritized action plan",    color: AMBER   },
  ];

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, opacity: op }}>
      {/* Brand badge */}
      <div style={{ opacity: brandOp, transform: `translateY(${brandY}px)` }}>
        <Brand size="md" from={0} />
      </div>

      {/* GEO Score card */}
      <div style={{ transform: `translateY(${cardY + fl}px)` }}>
        <div style={{
          width: 820, background: "rgba(255,255,255,0.90)", backdropFilter: "blur(20px)",
          borderRadius: 28, overflow: "hidden",
          boxShadow: "0 28px 70px rgba(124,58,237,0.15)",
          border: "1.5px solid rgba(255,255,255,0.9)",
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "18px 28px 14px", borderBottom: "1px solid #F1F5F9", opacity: fi(f, 4, 16) }}>
            <Img src={staticFile("logopdp.jpg")} style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} />
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: sans, color: NAVY }}>ShowYourBrand</span>
            <div style={{ marginLeft: "auto", fontSize: 13, fontFamily: sans, color: GRAY_L, background: "#F1F5F9", borderRadius: 100, padding: "4px 12px" }}>AI Visibility Dashboard</div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 32, padding: "22px 32px 26px" }}>
            {/* Gauge */}
            <div style={{ flexShrink: 0 }}>
              <svg width={260} height={160} viewBox="0 0 260 160">
                <defs>
                  <linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#C4B5FD" />
                    <stop offset="50%" stopColor={TEAL} />
                    <stop offset="100%" stopColor={GREEN} />
                  </linearGradient>
                </defs>
                <path d="M20,148 A110,110 0 0 1 240,148" fill="none" stroke="#E2E8F0" strokeWidth={18} strokeLinecap="round" />
                <path d="M20,148 A110,110 0 0 1 240,148" fill="none" stroke="url(#g2)" strokeWidth={18} strokeLinecap="round"
                  strokeDasharray={Math.PI * 110} strokeDashoffset={Math.PI * 110 * (1 - arc)} />
                {score > 0 && (() => {
                  const a2 = Math.PI - arc * Math.PI;
                  return <circle cx={130 + 110 * Math.cos(a2)} cy={148 - 110 * Math.sin(a2)} r={9} fill={TEAL} stroke={WHITE} strokeWidth={3} />;
                })()}
                <text x={130} y={128} textAnchor="middle" fontSize={62} fontWeight={800} fontFamily={sans} fill={NAVY}>{score}</text>
                <text x={130} y={152} textAnchor="middle" fontSize={16} fontFamily={sans} fill={GRAY_L}>/100</text>
              </svg>
              <div style={{ display: "flex", justifyContent: "center", marginTop: -6, opacity: fi(f, 55, 68) }}>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "#ECFDF5", borderRadius: 100, padding: "7px 18px", border: "1px solid #A7F3D0" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: TEAL }} />
                  <span style={{ fontSize: 16, fontWeight: 700, fontFamily: sans, color: "#065F46" }}>Excellent · Top 5%</span>
                </div>
              </div>
            </div>

            {/* Steps */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
              {steps.map((step, i) => {
                const sp  = stepSprings[i];
                const tx  = interpolate(sp, [0, 1], [40, 0]);
                const sop = fi(f, 74 + i * 14, 88 + i * 14);
                const sc  = interpolate(sp, [0, 1], [0.88, 1]);
                return (
                  <div key={i} style={{
                    opacity: sop, transform: `translateX(${tx}px) scale(${sc})`,
                    display: "flex", alignItems: "center", gap: 14,
                    background: `${step.color}0e`, borderRadius: 14, padding: "14px 18px",
                    border: `1px solid ${step.color}22`,
                  }}>
                    <span style={{ fontSize: 26 }}>{step.icon}</span>
                    <span style={{ fontSize: 20, fontFamily: sans, fontWeight: 600, color: NAVY }}>{step.label}</span>
                    <div style={{ marginLeft: "auto", width: 8, height: 8, borderRadius: "50%", background: step.color }} />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <Sub text="ShowYourBrand audits 100 AI prompts and gives you a GEO score from 0 to 100." total={S3} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 4 — The Results  (375–510)
// "+340% AI citations in 30 days"
// ══════════════════════════════════════════════════════════════════════════
const S4 = 135;

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S4);

  // Headline pop
  const titleSp = spring({ frame: f - 6, fps, config: { damping: 13, stiffness: 115 } });
  const titleSc = interpolate(titleSp, [0, 1], [0.72, 1]);
  const titleOp = fi(f, 6, 20);

  // Big counter — fast
  const pctCount = Math.round(fi(f, 24, 52, 0, 340));
  const countSp  = spring({ frame: f - 20, fps, config: { damping: 18, stiffness: 72 } });
  const countSc  = interpolate(countSp, [0, 1], [0.6, 1]);
  const fl       = floatY(f, 5, 120);

  // Before/after bars
  const beforeW = fi(f, 58, 76, 0, 22);
  const afterW  = fi(f, 66, 90, 0, 88);

  // Stat chips
  const chip1Op = fi(f, 92, 106);
  const chip2Op = fi(f, 100, 114);
  const chip1Sp = spring({ frame: f - 92, fps, config: { damping: 16, stiffness: 100 } });
  const chip2Sp = spring({ frame: f - 100, fps, config: { damping: 16, stiffness: 100 } });
  const chip1Sc = interpolate(chip1Sp, [0, 1], [0.7, 1]);
  const chip2Sc = interpolate(chip2Sp, [0, 1], [0.7, 1]);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, opacity: op }}>
      {/* "Real results." label */}
      <div style={{ opacity: titleOp, transform: `scale(${titleSc})`, fontSize: 28, fontFamily: sans, fontWeight: 600, color: GRAY, letterSpacing: 3, textTransform: "uppercase" }}>
        Real results.
      </div>

      {/* Giant +340% */}
      <div style={{ opacity: fi(f, 20, 34), transform: `scale(${countSc}) translateY(${fl}px)`, textAlign: "center", lineHeight: 1 }}>
        <span style={{ fontSize: 160, fontWeight: 900, fontFamily: sans, letterSpacing: -6 }}>
          <span style={{ color: TEAL }}>+</span><span style={{ color: NAVY }}>{pctCount}</span><span style={{ color: TEAL, fontSize: 100 }}>%</span>
        </span>
        <div style={{ fontSize: 32, fontFamily: serif, fontWeight: 600, color: GRAY, marginTop: -8 }}>
          AI citations in 30 days
        </div>
      </div>

      {/* Before / After bars */}
      <div style={{ width: 820, display: "flex", flexDirection: "column", gap: 12, opacity: fi(f, 54, 68) }}>
        {/* Before */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 22, fontFamily: sans, color: GRAY, width: 80, textAlign: "right", flexShrink: 0 }}>Before</span>
          <div style={{ flex: 1, height: 18, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${beforeW * 100}%`, background: "#CBD5E1", borderRadius: 100 }} />
          </div>
          <span style={{ fontSize: 20, fontFamily: sans, fontWeight: 700, color: GRAY, width: 60, flexShrink: 0 }}>22%</span>
        </div>
        {/* After */}
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span style={{ fontSize: 22, fontFamily: sans, color: NAVY, width: 80, textAlign: "right", flexShrink: 0, fontWeight: 700 }}>After</span>
          <div style={{ flex: 1, height: 18, background: "#F1F5F9", borderRadius: 100, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${afterW * 100}%`, background: `linear-gradient(90deg,${PURPLE},${TEAL})`, borderRadius: 100 }} />
          </div>
          <span style={{ fontSize: 20, fontFamily: sans, fontWeight: 800, color: TEAL, width: 60, flexShrink: 0 }}>88%</span>
        </div>
      </div>

      {/* Stat chips */}
      <div style={{ display: "flex", gap: 20 }}>
        <div style={{ opacity: chip1Op, transform: `scale(${chip1Sc})`, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.84)", backdropFilter: "blur(12px)", borderRadius: 100, padding: "12px 28px", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 6px 20px rgba(124,58,237,0.10)" }}>
          <span style={{ fontSize: 28, fontWeight: 800, fontFamily: sans, color: PURPLE }}>40+</span>
          <span style={{ fontSize: 22, fontFamily: sans, color: GRAY }}>brands optimized</span>
        </div>
        <div style={{ opacity: chip2Op, transform: `scale(${chip2Sc})`, display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.84)", backdropFilter: "blur(12px)", borderRadius: 100, padding: "12px 28px", border: "1.5px solid rgba(255,255,255,0.9)", boxShadow: "0 6px 20px rgba(124,58,237,0.10)" }}>
          <span style={{ fontSize: 28, fontWeight: 800, fontFamily: sans, color: TEAL }}>10 min</span>
          <span style={{ fontSize: 22, fontFamily: sans, color: GRAY }}>to your GEO score</span>
        </div>
      </div>

      <Sub text="Brands that fix their GEO score see +340% AI citations in the first month." total={S4} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 5 — CTA  (495–600)
// ══════════════════════════════════════════════════════════════════════════
const S5 = 105;

const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();
  const op = sceneOp(f, S5);

  const ctaSp  = spring({ frame: f - 26, fps, config: { damping: 16, stiffness: 88 } });
  const ctaSc  = interpolate(ctaSp, [0, 1], [0.80, 1]);
  const pulse  = 0.75 + Math.sin((f / 22) * Math.PI) * 0.25;
  const tagline = slideUp(f, 48, 18);
  const urlOp   = fi(f, 64, 78);

  // Underline draw
  const uProg = fi(f, 36, 58);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 36, opacity: op }}>
      <Brand size="lg" from={0} />

      {/* Tagline */}
      <div style={{ ...tagline, textAlign: "center", padding: "0 80px" }}>
        <span style={{ fontSize: 52, fontFamily: serif, fontWeight: 600, color: NAVY, lineHeight: 1.25 }}>
          Mention your{" "}
          <span style={{ color: PURPLE, position: "relative", display: "inline-block" }}>
            Brand
            <svg viewBox="0 0 220 20" style={{ position: "absolute", bottom: -8, left: -6, width: "calc(100% + 12px)", height: 20 }}>
              <path d="M4,16 Q55,4 110,13 Q165,20 216,8" fill="none" stroke={PURPLE} strokeWidth={4} strokeLinecap="round"
                strokeDasharray={230} strokeDashoffset={230 * (1 - uProg)} opacity={0.85} />
            </svg>
          </span>{" "}
          on AI.
        </span>
      </div>

      {/* CTA button */}
      <div style={{
        opacity: fi(f, 28, 44),
        transform: `scale(${ctaSc}) translateY(${floatY(f + 55, 4, 105)}px)`,
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 18,
          background: NAVY, borderRadius: 100, padding: "28px 72px",
          boxShadow: `0 0 ${32 * pulse}px ${14 * pulse}px rgba(124,58,237,0.28)`,
        }}>
          <span style={{ fontSize: 28 }}>🚀</span>
          <span style={{ fontSize: 30, fontWeight: 800, fontFamily: sans, color: WHITE, letterSpacing: -0.3 }}>
            Book a Demo · Subscribe Now
          </span>
        </div>
      </div>

      {/* URL */}
      <div style={{ opacity: urlOp, fontSize: 28, fontFamily: sans, color: GRAY_L }}>
        showyourbrand.app
      </div>

      <Sub text="ShowYourBrand. Make AI cite your brand first." total={S5} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Root composition — 600 frames = 20 s @ 30 fps
// ══════════════════════════════════════════════════════════════════════════
export const SYBVideo_GEO2: React.FC = () => (
  <AbsoluteFill>
    <BG />
    <Sequence from={0}   durationInFrames={120}><Scene1 /></Sequence>
    <Sequence from={105} durationInFrames={135}><Scene2 /></Sequence>
    <Sequence from={225} durationInFrames={165}><Scene3 /></Sequence>
    <Sequence from={375} durationInFrames={135}><Scene4 /></Sequence>
    <Sequence from={495} durationInFrames={105}><Scene5 /></Sequence>
  </AbsoluteFill>
);
