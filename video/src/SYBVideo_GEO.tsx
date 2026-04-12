/**
 * SYBVideo_GEO — Apple Keynote Cinematic
 * 4K 3840 × 2160  |  25 s @ 60 fps = 1 500 frames
 *
 * Aesthetic: Precise. Serene. Premium. Inevitable.
 * Like the product existed before the video started —
 * you are just discovering its perfection.
 *
 * Scene 1 (0–300)      Void → logo emergence from darkness
 * Scene 2 (298–658)    6 × macro close-up cuts (0.3–0.5 s each)
 * Scene 3 (656–1000)   Floating orbital product reveal + reflection
 * Scene 4 (998–1294)   Three feature isolation moments
 * Scene 5 (1292–1500)  Hero settle → score → tagline → fade to white
 */
import React from "react";
import {
  AbsoluteFill, interpolate, spring,
  useCurrentFrame, useVideoConfig,
  Sequence, Easing, staticFile, Img,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

// ── Fonts ──────────────────────────────────────────────────────────────────
const { fontFamily: sans } = loadInter("normal", {
  weights: ["200","300","400","500","600","700","800"],
  subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});

// ── Palette ────────────────────────────────────────────────────────────────
const BG     = "#070710";          // studio void
const CARD   = "#0C1425";          // product surface
const TEXT   = "#FFFFFF";
const DIM    = "rgba(255,255,255,0.52)";
const TEAL   = "#22D3EE";
const VIOLET = "#A78BFA";
const GREEN  = "#34D399";

// ── Helpers ────────────────────────────────────────────────────────────────
const fi = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const eio = Easing.inOut(Easing.cubic);
const eo  = Easing.out(Easing.cubic);
const ei  = Easing.in(Easing.cubic);

const floatY = (f: number, amp = 8, period = 240) =>
  Math.sin((f / period) * Math.PI * 2) * amp;

// ── Studio background ──────────────────────────────────────────────────────
const StudioBG: React.FC = () => (
  <AbsoluteFill style={{ background: BG }}>
    {/* Subtle overhead softbox bloom */}
    <div style={{
      position: "absolute", top: -300, left: "50%",
      transform: "translateX(-50%)",
      width: 2400, height: 1200, borderRadius: "50%",
      background: "radial-gradient(ellipse,rgba(167,139,250,0.04) 0%,transparent 70%)",
    }} />
    {/* Floor gradient */}
    <div style={{
      position: "absolute", bottom: 0, left: 0, right: 0, height: "38%",
      background: "linear-gradient(to top,rgba(167,139,250,0.025) 0%,transparent 100%)",
    }} />
  </AbsoluteFill>
);

// ── Platform data ──────────────────────────────────────────────────────────
const PLATFORMS = [
  { name: "ChatGPT",    score: 89, color: "#10A37F" },
  { name: "Claude",     score: 72, color: "#D97706" },
  { name: "Perplexity", score: 84, color: "#6366F1" },
  { name: "Gemini",     score: 61, color: "#4285F4" },
  { name: "Grok",       score: 78, color: "#94A3B8" },
];

// ── The Product Card ───────────────────────────────────────────────────────
// Pure display component — no hooks. All animation values passed as props.
interface CardProps {
  score: number;
  rotY?: number;
  rotX?: number;
  rowsOpacity?: number;
}

const ProductCard: React.FC<CardProps> = ({ score, rotY = 0, rotX = 0, rowsOpacity = 0 }) => {
  const arc = Math.min(score / 100, 1);
  const rimIntensity = Math.abs(rotY) / 25;

  // Arc dot position
  const dotAngle = Math.PI - arc * Math.PI;
  const dotCx = 230 + 200 * Math.cos(dotAngle);
  const dotCy = 260 - 200 * Math.sin(dotAngle);

  return (
    <div style={{
      transform: `perspective(3200px) rotateY(${rotY}deg) rotateX(${rotX}deg)`,
      transformStyle: "preserve-3d",
    }}>
      <div style={{
        width: 1780,
        background: `linear-gradient(160deg,#111B2E 0%,#0B1220 50%,#0E1A30 100%)`,
        borderRadius: 44,
        border: `1px solid rgba(255,255,255,${0.07 + rimIntensity * 0.07})`,
        overflow: "hidden",
        boxShadow: [
          `0 0 220px rgba(167,139,250,${0.05 + rimIntensity * 0.07})`,
          `-6px 0 90px rgba(167,139,250,${0.08 + rimIntensity * 0.14})`,
          `6px 0 60px rgba(34,211,238,${0.03 + rimIntensity * 0.05})`,
          "0 100px 220px rgba(0,0,0,0.85)",
        ].join(", "),
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "44px 60px 36px",
          borderBottom: "1px solid rgba(255,255,255,0.055)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{
              width: 56, height: 56, borderRadius: 16, flexShrink: 0,
              background: "linear-gradient(135deg,#7C3AED,#14B8A6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{ fontSize: 26, color: TEXT, fontWeight: 800, fontFamily: sans }}>S</span>
            </div>
            <div>
              <div style={{ fontSize: 30, fontWeight: 600, fontFamily: sans, color: TEXT, letterSpacing: -0.4 }}>
                ShowYourBrand
              </div>
              <div style={{ fontSize: 16, fontFamily: sans, color: DIM, letterSpacing: 2.5, textTransform: "uppercase", marginTop: 2 }}>
                AI Visibility Platform
              </div>
            </div>
          </div>
          <div style={{
            fontSize: 16, fontFamily: sans, color: TEAL, letterSpacing: 2, textTransform: "uppercase",
            background: "rgba(34,211,238,0.09)", borderRadius: 100, padding: "9px 26px",
            border: "1px solid rgba(34,211,238,0.18)",
          }}>Live · 2025</div>
        </div>

        {/* Score + rows */}
        <div style={{ display: "flex", padding: "48px 60px 52px", gap: 64, alignItems: "center" }}>
          {/* Gauge SVG */}
          <div style={{ flexShrink: 0 }}>
            <svg width={480} height={295} viewBox="0 0 460 280">
              <defs>
                <linearGradient id="gArc" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#A78BFA" />
                  <stop offset="55%" stopColor={TEAL} />
                  <stop offset="100%" stopColor={GREEN} />
                </linearGradient>
                <filter id="arcGlow">
                  <feGaussianBlur stdDeviation="5" result="blur" />
                  <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
                </filter>
              </defs>
              <path d="M30,260 A200,200 0 0 1 430,260"
                fill="none" stroke="rgba(255,255,255,0.055)" strokeWidth={22} strokeLinecap="round" />
              <path d="M30,260 A200,200 0 0 1 430,260"
                fill="none" stroke="url(#gArc)" strokeWidth={22} strokeLinecap="round"
                strokeDasharray={Math.PI * 200}
                strokeDashoffset={Math.PI * 200 * (1 - arc)}
                filter="url(#arcGlow)" />
              {score > 0 && (
                <circle cx={dotCx} cy={dotCy} r={13} fill={TEAL} />
              )}
              <text x={230} y={224} textAnchor="middle" fontSize={108}
                fontWeight={800} fontFamily={sans} fill={TEXT}>{score}</text>
              <text x={230} y={268} textAnchor="middle" fontSize={20}
                fontFamily={sans} fill={DIM} letterSpacing={3}>/100  GEO SCORE</text>
            </svg>
            <div style={{ display: "flex", justifyContent: "center", marginTop: 4 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 10,
                background: "rgba(52,211,153,0.09)", borderRadius: 100, padding: "10px 28px",
                border: "1px solid rgba(52,211,153,0.20)",
              }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: GREEN }} />
                <span style={{ fontSize: 18, fontWeight: 600, fontFamily: sans, color: GREEN, letterSpacing: 1.8 }}>
                  EXCELLENT · TOP 5%
                </span>
              </div>
            </div>
          </div>

          {/* Platform rows */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ fontSize: 15, fontFamily: sans, color: "rgba(255,255,255,0.22)", letterSpacing: 3.5, textTransform: "uppercase", marginBottom: 8 }}>
              Visibility per platform
            </div>
            {PLATFORMS.map((p, i) => (
              <div key={i} style={{ opacity: rowsOpacity, display: "flex", alignItems: "center", gap: 22 }}>
                <div style={{ width: 12, height: 12, borderRadius: "50%", background: p.color, flexShrink: 0 }} />
                <span style={{ width: 150, fontSize: 22, fontFamily: sans, color: DIM }}>{p.name}</span>
                <div style={{ flex: 1, height: 5, background: "rgba(255,255,255,0.055)", borderRadius: 100 }}>
                  <div style={{
                    height: "100%", width: `${p.score}%`, borderRadius: 100,
                    background: p.color, boxShadow: `0 0 10px ${p.color}60`,
                  }} />
                </div>
                <span style={{ fontSize: 22, fontWeight: 700, fontFamily: sans, color: TEXT, width: 46, textAlign: "right" }}>
                  {p.score}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 1 — Void → Logo Emergence  (0–300)
// Starts in pure darkness. The SYB mark materialises slowly — inevitable.
// ══════════════════════════════════════════════════════════════════════════
const S1 = 300;

const Scene1: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Mark emerges from fog
  const markSp = spring({ frame: f - 20, fps, config: { damping: 22, stiffness: 28 } });
  const markOp = fi(f, 20, 160);
  const markSc = interpolate(markSp, [0, 1], [0.88, 1]);
  const markBlur = interpolate(f, [20, 140], [28, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eio });

  // Name fades in after mark settles
  const nameOp = fi(f, 120, 200);
  const nameY  = interpolate(f, [120, 180], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eo });

  // Subtle line appears below mark
  const lineW = interpolate(f, [160, 230], [0, 320], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eio });

  // Fade out
  const scOp = fi(f, 268, 300, 1, 0);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0, opacity: scOp }}>
      {/* Glow halo behind mark */}
      <div style={{
        position: "absolute",
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(167,139,250,0.08) 0%,transparent 70%)",
        opacity: markOp,
      }} />

      {/* The mark */}
      <div style={{
        opacity: markOp,
        transform: `scale(${markSc}) translateY(${floatY(f, 4, 240)}px)`,
        filter: `blur(${markBlur}px)`,
      }}>
        <div style={{
          width: 200, height: 200, borderRadius: 52,
          background: "linear-gradient(145deg,#7C3AED,#14B8A6)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 0 120px rgba(167,139,250,0.28), 0 0 40px rgba(20,184,166,0.20)",
        }}>
          <Img src={staticFile("logopdp.jpg")} style={{
            width: 200, height: 200, borderRadius: 52, objectFit: "cover", opacity: 0.95,
          }} />
        </div>
      </div>

      {/* Name */}
      <div style={{ opacity: nameOp, transform: `translateY(${nameY}px)`, marginTop: 56, textAlign: "center" }}>
        <div style={{ fontSize: 72, fontWeight: 300, fontFamily: sans, color: TEXT, letterSpacing: 12, textTransform: "uppercase" }}>
          ShowYourBrand
        </div>
      </div>

      {/* Thin separator line */}
      <div style={{
        marginTop: 52,
        width: lineW, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(167,139,250,0.55),transparent)",
      }} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 2 — Macro Cuts  (298–658)
// Six rapid extreme close-ups: each 60 frames = 1 second @ 60fps.
// 8 frames hard in, 44 hold, 8 frames hard out.
// ══════════════════════════════════════════════════════════════════════════
const S2 = 360;

// Reusable macro container
const MacroShot: React.FC<{ children: React.ReactNode; start: number; end: number }> = ({ children, start, end }) => {
  const f = useCurrentFrame();
  const op = Math.min(fi(f, start, start + 8), fi(f, end - 8, end, 1, 0));
  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: op }}>
      {children}
    </AbsoluteFill>
  );
};

const Scene2: React.FC = () => {
  const f = useCurrentFrame();

  // Arc progress for cut 2 — pre-compute
  const arcPct = fi(f, 0, 60, 0.87, 0.87); // static at 87%

  // Score for cut 1
  const scoreOp = Math.min(fi(f, 0, 8), fi(f, 52, 60, 1, 0));
  const arcOp   = Math.min(fi(f, 60, 68), fi(f, 112, 120, 1, 0));
  const auditOp = Math.min(fi(f, 120, 128), fi(f, 172, 180, 1, 0));
  const dotsOp  = Math.min(fi(f, 180, 188), fi(f, 232, 240, 1, 0));
  const geoOp   = Math.min(fi(f, 240, 248), fi(f, 292, 300, 1, 0));
  const edgeOp  = Math.min(fi(f, 300, 308), fi(f, 352, 360, 1, 0));

  // Scale pulse for "GEO" cut
  const geoSc = interpolate(f, [240, 270, 330, 360], [0.96, 1, 1, 0.97], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      {/* Cut 1: Giant score number "87" */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: scoreOp }}>
        <div style={{ fontSize: 1400, fontWeight: 800, fontFamily: sans, color: TEXT, lineHeight: 1, letterSpacing: -40 }}>
          87
        </div>
      </AbsoluteFill>

      {/* Cut 2: Arc fragment — TEAL curve in extreme close */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: arcOp }}>
        <svg width={3840} height={2160} viewBox="0 0 3840 2160" style={{ position: "absolute" }}>
          <defs>
            <linearGradient id="macArc" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity={0} />
              <stop offset="40%" stopColor={TEAL} />
              <stop offset="100%" stopColor="#34D399" stopOpacity={0.6} />
            </linearGradient>
            <filter id="macGlow">
              <feGaussianBlur stdDeviation="12" result="b" />
              <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* A single large arc — zoomed in so only the curve is visible */}
          <path d="M-400,2800 A2400,2400 0 0 1 4240,2800"
            fill="none" stroke="url(#macArc)" strokeWidth={60} strokeLinecap="round"
            strokeDasharray={Math.PI * 2400}
            strokeDashoffset={Math.PI * 2400 * (1 - arcPct)}
            filter="url(#macGlow)" />
        </svg>
      </AbsoluteFill>

      {/* Cut 3: "AUDIT" in extreme caps */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: auditOp }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 280, fontWeight: 200, fontFamily: sans, color: TEXT, letterSpacing: 80, textTransform: "uppercase" }}>
            AUDIT
          </div>
          <div style={{ fontSize: 52, fontWeight: 300, fontFamily: sans, color: DIM, letterSpacing: 12, textTransform: "uppercase", marginTop: 16 }}>
            100 prompts · 5 AI models
          </div>
        </div>
      </AbsoluteFill>

      {/* Cut 4: 5 platform dots in perfect alignment */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: dotsOp }}>
        <div style={{ display: "flex", gap: 80, alignItems: "center" }}>
          {PLATFORMS.map((p, i) => (
            <div key={i} style={{
              opacity: fi(f, 180 + i * 4, 192 + i * 4),
              display: "flex", flexDirection: "column", alignItems: "center", gap: 24,
            }}>
              <div style={{
                width: 60, height: 60, borderRadius: "50%", background: p.color,
                boxShadow: `0 0 40px ${p.color}80`,
              }} />
              <div style={{ fontSize: 26, fontFamily: sans, color: DIM, letterSpacing: 2, textTransform: "uppercase" }}>
                {p.name}
              </div>
            </div>
          ))}
        </div>
      </AbsoluteFill>

      {/* Cut 5: "GEO" — ultra minimal */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: geoOp }}>
        <div style={{ transform: `scale(${geoSc})`, textAlign: "center" }}>
          <div style={{ fontSize: 440, fontWeight: 800, fontFamily: sans, color: TEXT, letterSpacing: -16, lineHeight: 1 }}>
            GEO
          </div>
          <div style={{ fontSize: 44, fontWeight: 300, fontFamily: sans, color: DIM, letterSpacing: 14, textTransform: "uppercase", marginTop: 8 }}>
            Generative Engine Optimization
          </div>
        </div>
      </AbsoluteFill>

      {/* Cut 6: Rim light catching card edge */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: edgeOp }}>
        {/* Vertical card edge line */}
        <div style={{
          width: 3, height: 1600,
          background: "linear-gradient(to bottom,transparent 0%,rgba(167,139,250,0.9) 20%,rgba(34,211,238,0.7) 60%,transparent 100%)",
          boxShadow: "0 0 60px rgba(167,139,250,0.6), 0 0 120px rgba(34,211,238,0.3)",
        }} />
        {/* Card surface partially revealed */}
        <div style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(4px, -50%)",
          width: 900, height: 1600,
          background: "linear-gradient(90deg,#0E1A2E,transparent)",
          borderLeft: "1px solid rgba(255,255,255,0.07)",
        }} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 3 — The Orbit  (656–1000)
// Product floats in space. Slow orbital camera sweep.
// Reflection materialises on the studio floor.
// ══════════════════════════════════════════════════════════════════════════
const S3 = 344;

const Scene3: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card enter
  const enterSp = spring({ frame: f, fps, config: { damping: 24, stiffness: 32 } });
  const cardY   = interpolate(enterSp, [0, 1], [80, 0]);
  const cardOp  = fi(f, 0, 50);

  // Orbital Y rotation: -20° → 8° → 0° (slow sweep)
  const rotY = interpolate(f,
    [0, 100, 200, 280, 344],
    [-20, -8, 4, 0, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eio }
  );

  // Gentle tilt
  const rotX = interpolate(f, [0, 120, 344], [-3, 1.5, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eio });

  // Slow push-in (scale)
  const zoom = interpolate(f, [60, 344], [1.0, 1.07], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eio });

  // Float
  const fy = floatY(f, 10, 300);

  // Reflection
  const refOp = fi(f, 40, 110, 0, 0.18);

  // Score for this scene — static at 87
  const score = 87;

  // Fade out at end
  const scOp = fi(f, 316, 344, 1, 0);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", opacity: scOp }}>
      <div style={{ transform: `scale(${zoom})` }}>
        {/* Product card */}
        <div style={{ opacity: cardOp, transform: `translateY(${cardY + fy}px)` }}>
          <ProductCard score={score} rotY={rotY} rotX={rotX} rowsOpacity={fi(f, 100, 200)} />
        </div>

        {/* Floor reflection */}
        <div style={{
          opacity: refOp,
          transform: `scaleY(-1) translateY(${-fy * 0.4}px)`,
          WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 55%)",
          marginTop: -2,
        }}>
          <ProductCard score={score} rotY={rotY} rotX={-rotX} />
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 4 — Feature Isolation  (998–1294)
// Three moments of absolute clarity. One word. One idea. Pure negative space.
// ══════════════════════════════════════════════════════════════════════════
const S4 = 296;

interface FeatureProps {
  label: string;
  sublabel: string;
  color: string;
  inFrame: number;
  outFrame: number;
  total: number;
}

const FeatureMoment: React.FC<FeatureProps> = ({ label, sublabel, color, inFrame, outFrame, total }) => {
  const f = useCurrentFrame();

  const labelOp = Math.min(fi(f, inFrame, inFrame + 12), fi(f, outFrame - 12, outFrame, 1, 0));
  const labelY  = interpolate(f, [inFrame, inFrame + 20], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eo });
  const subOp   = Math.min(fi(f, inFrame + 22, inFrame + 36), fi(f, outFrame - 12, outFrame, 1, 0));
  const subY    = interpolate(f, [inFrame + 22, inFrame + 38], [16, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eo });

  // Thin accent line
  const lineW = interpolate(f, [inFrame + 8, inFrame + 40, outFrame - 8, outFrame],
    [0, 280, 280, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {/* Label */}
      <div style={{ opacity: labelOp, transform: `translateY(${labelY}px)` }}>
        <span style={{
          fontSize: 320, fontWeight: 700, fontFamily: sans, color: TEXT,
          letterSpacing: -8, lineHeight: 1, display: "block",
        }}>{label}</span>
      </div>

      {/* Accent line */}
      <div style={{
        width: lineW, height: 2,
        background: `linear-gradient(90deg,transparent,${color},transparent)`,
        margin: "28px 0",
      }} />

      {/* Sublabel */}
      <div style={{ opacity: subOp, transform: `translateY(${subY}px)` }}>
        <span style={{ fontSize: 56, fontWeight: 300, fontFamily: sans, color: DIM, letterSpacing: 6 }}>
          {sublabel}
        </span>
      </div>
    </div>
  );
};

const Scene4: React.FC = () => {
  const f = useCurrentFrame();
  const op = Math.min(fi(f, 0, 10), fi(f, 285, 296, 1, 0));

  return (
    <AbsoluteFill style={{ opacity: op }}>
      <FeatureMoment label="AUDIT"    sublabel="100 prompts · every AI model"  color={VIOLET} inFrame={4}   outFrame={95}  total={S4} />
      <FeatureMoment label="SCORE"    sublabel="0 to 100 · across 5 platforms" color={TEAL}   inFrame={100} outFrame={193} total={S4} />
      <FeatureMoment label="OPTIMIZE" sublabel="your roadmap · instant clarity" color={GREEN}  inFrame={198} outFrame={290} total={S4} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// SCENE 5 — Hero Settle  (1292–1500)
// Full product in hero frame. Score counts to 87.
// Tagline. URL. Fade to pure white.
// ══════════════════════════════════════════════════════════════════════════
const S5 = 208;

const Scene5: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Card settles from below
  const cardSp = spring({ frame: f, fps, config: { damping: 26, stiffness: 38 } });
  const cardY  = interpolate(cardSp, [0, 1], [60, 0]);
  const cardOp = fi(f, 0, 40);

  // Score — fast count 0 → 87
  const score = Math.round(fi(f, 20, 70, 0, 87));
  const fy    = floatY(f, 7, 280);

  // Rows fade in after score settles
  const rowsOp = fi(f, 65, 110);

  // Tagline
  const tagOp = fi(f, 85, 115);
  const tagY  = interpolate(f, [85, 110], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: eo });

  // URL
  const urlOp = fi(f, 125, 152);

  // White fade out
  const whiteOp = fi(f, 175, 208);

  return (
    <AbsoluteFill style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 0 }}>
      {/* Product card */}
      <div style={{ opacity: cardOp, transform: `translateY(${cardY + fy}px)` }}>
        <ProductCard score={score} rowsOpacity={rowsOp} />
      </div>

      {/* Tagline */}
      <div style={{ opacity: tagOp, transform: `translateY(${tagY}px)`, marginTop: 72, textAlign: "center" }}>
        <div style={{ fontSize: 66, fontWeight: 300, fontFamily: sans, color: TEXT, letterSpacing: 3 }}>
          Make AI cite your brand.
        </div>
      </div>

      {/* URL */}
      <div style={{ opacity: urlOp, marginTop: 28 }}>
        <div style={{ fontSize: 38, fontWeight: 300, fontFamily: sans, color: DIM, letterSpacing: 6, textTransform: "uppercase" }}>
          showyourbrand.app
        </div>
      </div>

      {/* Fade to white */}
      <AbsoluteFill style={{
        background: TEXT,
        opacity: whiteOp,
        pointerEvents: "none",
      }} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Root composition — 1 500 frames = 25 s @ 60 fps
// ══════════════════════════════════════════════════════════════════════════
export const SYBVideo_GEO: React.FC = () => (
  <AbsoluteFill>
    <StudioBG />
    <Sequence from={0}    durationInFrames={300}><Scene1 /></Sequence>
    <Sequence from={298}  durationInFrames={360}><Scene2 /></Sequence>
    <Sequence from={656}  durationInFrames={344}><Scene3 /></Sequence>
    <Sequence from={998}  durationInFrames={296}><Scene4 /></Sequence>
    <Sequence from={1292} durationInFrames={208}><Scene5 /></Sequence>
  </AbsoluteFill>
);
