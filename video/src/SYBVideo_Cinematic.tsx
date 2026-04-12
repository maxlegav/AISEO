/**
 * SYBVideo_Cinematic — Premium GEO Brand Ad
 * 1920 × 1080  |  18 s @ 30 fps = 540 frames
 *
 * Act 1  (0–120)     Link Rain Chaos → "Nobody searches like this anymore."
 * Act 2  (110–240)   AI Chat window reveal
 * Act 3  (230–360)   Platform pills  (Perplexity · ChatGPT · Google AI Mode)
 * Act 4  (350–540)   Brand reveal · stats · CTA
 *
 * Scenes overlap ≈10 frames for smooth crossfades.
 * Every act has internal motion — nothing is static for more than 2 s.
 */
import React from "react";
import {
  AbsoluteFill, interpolate, spring,
  useCurrentFrame, useVideoConfig, Sequence, Easing,
} from "remotion";
import { loadFont as loadInter }     from "@remotion/google-fonts/Inter";
import { loadFont as loadCormorant } from "@remotion/google-fonts/CormorantGaramond";

// ── Fonts ──────────────────────────────────────────────────────────────────
const { fontFamily: sans }  = loadInter("normal", {
  weights: ["300","400","500","600","700","800"],
  subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});
const { fontFamily: serif } = loadCormorant("normal", {
  weights: ["300","400","500","600","700"],
  subsets: ["latin"], ignoreTooManyRequestsWarning: true,
});

// ── Palette ────────────────────────────────────────────────────────────────
const DARK   = "#1a1a2e";
const PURPLE = "#9b6fd4";
const TEAL   = "#4ecdc4";
const GRAY   = "#8a8a9a";
const BLUE   = "#2563eb";
const VIOLET = "#7c3aed";
const INDIGO = "#5b6ef5";

// ── Helpers ────────────────────────────────────────────────────────────────
const fi = (f: number, a: number, b: number, from = 0, to = 1) =>
  interpolate(f, [a, b], [from, to], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

const snap = Easing.bezier(0.16, 1, 0.3, 1);

const floatY = (f: number, amp = 5, period = 180) =>
  Math.sin((f / period) * Math.PI * 2) * amp;

// Seeded deterministic random — gives stable link rain across renders
const sr = (seed: number): number => {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
};

// ── Link rain data (pre-computed, fully deterministic) ─────────────────────
const LINK_TEXTS = [
  "www.site1.com","www.example.org","Top 10 best products 2024…",
  "Click here for more","Page 2 of 847,000 results","www.freeinfo.biz",
  "More results →","Next page ▸","Did you mean…?","www.topresults.co",
  "Showing results 11–20 of 2,340,000","Related searches:","www.webdir.com",
  "Page 7 of results","www.olddirectory.org",
  "◀ Previous | 1 2 3 4 5 6 | Next ▶","Cached — Similar pages",
  "Not what you're looking for?","Refine search…",
  "People also searched for:","www.spammy.biz","▲ Sponsored",
  "More from this site →","About 4,810,000 results (0.48 sec)",
  "Feedback | Report","Safe Search: Off","→ See all results",
  "www.articles2024.net","Search tools ▾","www.hub99.org",
];
const SYMS = ["⊕","⊗","◇","△","⬡","✧","⬢","⊞","◈"];

interface LinkDatum {
  text: string; x: number; startFrame: number; duration: number;
  size: number; rotation: number; baseOpacity: number; isSym: boolean;
}

const LINKS: LinkDatum[] = Array.from({ length: 56 }, (_, i) => {
  const isSym = sr(i * 7 + 6) < 0.13;
  return {
    text:        isSym ? SYMS[Math.floor(sr(i * 7) * SYMS.length)] : LINK_TEXTS[i % LINK_TEXTS.length],
    x:           sr(i * 7 + 1) * 104,
    startFrame:  sr(i * 7 + 2) * 62,
    duration:    30 + sr(i * 7 + 3) * 36,
    size:        (isSym ? 0.9 + sr(i * 7 + 4) * 0.6 : 0.76 + sr(i * 7 + 4) * 0.52) * 19.2,
    rotation:    (sr(i * 7 + 5) - 0.5) * 9,
    baseOpacity: 0.54 + sr(i * 7 + 6) * 0.42,
    isSym,
  };
});

// ── Pastel background with animated orbs ──────────────────────────────────
const BG: React.FC = () => {
  const f = useCurrentFrame();
  const bx = Math.sin((f / 240) * Math.PI * 2) * 22;
  const by = Math.cos((f / 300) * Math.PI * 2) * 18;

  return (
    <AbsoluteFill style={{ background: "linear-gradient(140deg,#d4bcea 0%,#f0b3ca 48%,#f9c8a2 100%)" }}>
      {/* Top-left lavender orb */}
      <div style={{
        position: "absolute", left: -120 + bx, top: -100 + by,
        width: 700, height: 700, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(197,168,224,0.45) 0%,transparent 70%)",
        transform: "translate(-50%,-50%)",
      }} />
      {/* Bottom-right peach orb */}
      <div style={{
        position: "absolute", right: -80 - bx * 0.5, bottom: -60 - by * 0.5,
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(246,194,158,0.42) 0%,transparent 70%)",
        transform: "translate(50%,50%)",
      }} />
      {/* Centre blush orb */}
      <div style={{
        position: "absolute", left: "52%", top: "48%",
        width: 900, height: 900, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(238,175,201,0.25) 0%,transparent 65%)",
        transform: `translate(-50%,-50%) translate(${bx * 0.3}px,${by * 0.3}px)`,
      }} />
      {/* Right teal accent orb */}
      <div style={{
        position: "absolute", right: "8%", top: "30%",
        width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle,rgba(167,243,208,0.18) 0%,transparent 70%)",
        transform: `translate(50%,-50%) translate(${by * 0.4}px,${bx * 0.2}px)`,
      }} />
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ACT 1 — The Chaos  (Sequence: from=0, duration=120)
// Link rain for 2.2 s → hard freeze → headline slams → dissolve upward
// ══════════════════════════════════════════════════════════════════════════
const FREEZE_F  = 66;
const DISSOLVE_F = 100;

const Act1: React.FC = () => {
  const f = useCurrentFrame();

  const sceneOp = Math.min(fi(f, 0, 6), fi(f, 112, 120, 1, 0));

  // Headline: spring slam from below
  const hlOp = Math.min(fi(f, 68, 82, 0, 1), fi(f, DISSOLVE_F, DISSOLVE_F + 8, 1, 0));
  const hlY  = interpolate(f, [68, 86], [72, 0], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap,
  });

  return (
    <AbsoluteFill style={{ opacity: sceneOp }}>

      {/* ── Link rain ──────────────────────────────────────────────────── */}
      {LINKS.map((lk, i) => {
        // Y during active rain (clamped at freeze frame)
        const activeF = Math.min(f, FREEZE_F);
        const rainY = interpolate(
          activeF - lk.startFrame, [0, lk.duration], [-55, 1155],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        // Y frozen at the exact moment of freeze
        const frozenY = interpolate(
          FREEZE_F - lk.startFrame, [0, lk.duration], [-55, 1155],
          { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
        );
        // Dissolve: drift upward
        const dissOff = f >= DISSOLVE_F
          ? interpolate(f, [DISSOLVE_F, DISSOLVE_F + 15], [0, -98], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
          : 0;
        const dissOp = f >= DISSOLVE_F ? fi(f, DISSOLVE_F, DISSOLVE_F + 15, 1, 0) : 1;

        const finalY = (f < FREEZE_F ? rainY : frozenY) + dissOff;
        if (finalY < -62 || finalY > 1162) return null;

        return (
          <div key={i} style={{
            position: "absolute",
            left: `${lk.x}%`,
            top: finalY,
            fontSize: lk.size,
            opacity: lk.baseOpacity * dissOp,
            transform: `rotate(${lk.rotation}deg)`,
            color: lk.isSym ? VIOLET : BLUE,
            textDecoration: lk.isSym ? "none" : "underline",
            textUnderlineOffset: 2,
            whiteSpace: "nowrap",
            fontFamily: sans,
            pointerEvents: "none",
            userSelect: "none",
          }}>
            {lk.text}
          </div>
        );
      })}

      {/* ── Headline ───────────────────────────────────────────────────── */}
      <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", zIndex: 20 }}>
        <div style={{
          opacity: hlOp,
          transform: `translateY(${hlY}px)`,
          fontFamily: serif,
          fontSize: 90,
          fontWeight: 600,
          fontStyle: "italic",
          color: DARK,
          textAlign: "center",
          lineHeight: 1.08,
          maxWidth: 1420,
          textShadow: "0 4px 40px rgba(255,255,255,.92), 0 2px 12px rgba(255,255,255,.65)",
          letterSpacing: -0.5,
        }}>
          Nobody searches like this{" "}
          <span style={{ color: VIOLET, fontStyle: "normal", fontWeight: 300 }}>anymore.</span>
        </div>
      </AbsoluteFill>

    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ACT 2 — The Shift  (Sequence: from=110, duration=130)
// Frosted chat window slides up from bottom · user question · AI cites SYB
// ══════════════════════════════════════════════════════════════════════════
const Act2: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOp = Math.min(fi(f, 0, 10), fi(f, 118, 130, 1, 0));

  // Chat window: spring from below
  const chatSp = spring({ frame: f - 4, fps, config: { damping: 14, stiffness: 140, mass: 1.1 } });
  const chatY  = interpolate(chatSp, [0, 1], [1100, 0]);

  // User bubble
  const ubOp = fi(f, 20, 33, 0, 1);
  const ubX  = interpolate(f, [20, 33], [30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  // AI row
  const aiOp = fi(f, 37, 50, 0, 1);
  const aiX  = interpolate(f, [37, 50], [-30, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  // Tagline
  const tlOp = fi(f, 58, 70, 0, 1);
  const tlY  = interpolate(f, [58, 70], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  return (
    <AbsoluteFill style={{
      opacity: sceneOp,
      display: "flex", alignItems: "center", justifyContent: "center",
    }}>
      {/* Chat window */}
      <div style={{
        width: 720,
        transform: `translateY(${chatY}px)`,
        background: "rgba(255,255,255,0.80)",
        backdropFilter: "blur(28px)",
        borderRadius: 20,
        overflow: "hidden",
        boxShadow: "0 32px 80px rgba(0,0,0,0.14), 0 8px 24px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.95)",
        border: "1px solid rgba(255,255,255,0.82)",
      }}>
        {/* macOS traffic-light title bar */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "13px 16px",
          background: "rgba(248,248,252,0.90)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}>
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#ff5f57" }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: 13, height: 13, borderRadius: "50%", background: "#28c840" }} />
          <span style={{ marginLeft: 10, fontSize: 12, fontFamily: sans, fontWeight: 500, color: "#9090a0", letterSpacing: "0.04em" }}>
            ✦ &nbsp;AI Assistant — New Conversation
          </span>
        </div>

        {/* Bubbles */}
        <div style={{ padding: "22px 26px", display: "flex", flexDirection: "column", gap: 16, minHeight: 180 }}>

          {/* User bubble */}
          <div style={{
            alignSelf: "flex-end",
            opacity: ubOp, transform: `translateX(${ubX}px)`,
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            color: "#fff",
            padding: "12px 20px",
            borderRadius: "20px 20px 5px 20px",
            fontSize: 18, fontWeight: 500, fontFamily: sans,
            maxWidth: "84%", lineHeight: 1.45,
            boxShadow: "0 4px 18px rgba(99,102,241,0.32)",
          }}>
            How do I boost my brand's digital visibility in 2025?
          </div>

          {/* AI row */}
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 11,
            opacity: aiOp, transform: `translateX(${aiX}px)`,
          }}>
            <div style={{
              width: 42, height: 42, borderRadius: "50%", flexShrink: 0,
              background: "linear-gradient(135deg,#9b6fd4,#c084fc)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 19, color: "#fff",
              boxShadow: "0 0 0 3px rgba(155,111,212,0.22), 0 2px 14px rgba(155,111,212,0.28)",
            }}>✦</div>
            <div style={{
              background: "rgba(255,255,255,0.94)",
              border: "1px solid rgba(155,111,212,0.14)",
              padding: "12px 20px",
              borderRadius: "5px 20px 20px 20px",
              fontSize: 17, fontFamily: sans, color: DARK, lineHeight: 1.58, maxWidth: "78%",
            }}>
              I recommend{" "}
              <strong style={{ color: VIOLET }}>ShowYourBrand</strong>
              {" "}— they specialize in getting brands cited inside AI answers. Their GEO methodology is best-in-class.
            </div>
          </div>

        </div>
      </div>

      {/* Tagline below chat window */}
      <div style={{
        position: "absolute", bottom: "13%", left: "50%",
        transform: `translateX(-50%) translateY(${tlY}px)`,
        opacity: tlOp,
        fontFamily: serif,
        fontSize: 38, fontWeight: 600, color: DARK,
        whiteSpace: "nowrap", letterSpacing: 0.3,
      }}>
        <span style={{ color: GRAY, fontSize: 20, marginRight: 8 }}>◆</span>
        AI picks the best.{" "}
        <span style={{ color: PURPLE, fontStyle: "italic" }}>Instantly.</span>
      </div>

    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ACT 3 — Be Mentioned  (Sequence: from=230, duration=130)
// Label + three frosted platform pills, staggered 5 frames apart, glow pulse
// ══════════════════════════════════════════════════════════════════════════
const PerplexityIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" width={30} height={30} fill="none">
    <rect width={36} height={36} rx={9} fill="#1c2333"/>
    <polygon points="18,6 30,13 30,23 18,30 6,23 6,13" stroke="#20b2e8" strokeWidth="1.8" fill="none"/>
    <line x1="18" y1="6" x2="18" y2="30" stroke="#20b2e8" strokeWidth="1.4" opacity=".7"/>
    <line x1="6" y1="13" x2="30" y2="23" stroke="#20b2e8" strokeWidth="1.2" opacity=".45"/>
    <line x1="6" y1="23" x2="30" y2="13" stroke="#20b2e8" strokeWidth="1.2" opacity=".45"/>
    <circle cx="18" cy="18" r="3" fill="#20b2e8"/>
  </svg>
);

const ChatGPTIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" width={30} height={30} fill="none">
    <rect width={36} height={36} rx={9} fill="#10a37f"/>
    <text x="18" y="25" textAnchor="middle" fontSize="20" fontFamily="Georgia,serif" fill="white">✦</text>
  </svg>
);

const GoogleIcon: React.FC = () => (
  <svg viewBox="0 0 36 36" width={30} height={30}>
    <rect width={36} height={36} rx={9} fill="white"/>
    <path d="M18 9c-5 0-9 4-9 9s4 9 9 9c5.5 0 9-3.8 9-9H18v3.4h5.2c-.8 2.3-3 3.8-5.2 3.8-3.2 0-5.7-2.6-5.7-5.8s2.5-5.8 5.7-5.8c1.5 0 2.9.6 3.9 1.5l2.5-2.5C22.8 10.3 20.5 9 18 9z" fill="#4285f4"/>
    <path d="M10.3 13.9C9.5 15.2 9 16.5 9 18s.5 2.8 1.3 4.1l3.5-2.7C13.3 18.9 13 18 13 17s.3-1.9.8-2.6l-3.5-2.5z" fill="#34a853"/>
    <path d="M18 27c2.6 0 4.9-.9 6.6-2.4l-3.4-2.6c-.9.6-2.1 1-3.2 1-2.2 0-4.2-1.5-5-3.6l-3.4 2.6C11 24.2 14.2 27 18 27z" fill="#fbbc05"/>
    <path d="M27 18c0-.7-.1-1.3-.2-2H18v4h4.5c-.5 1.2-1.4 2.2-2.5 2.8l3.4 2.6C25.9 23.4 27 20.9 27 18z" fill="#ea4335"/>
  </svg>
);

const PLATFORMS = [
  { icon: <PerplexityIcon />, name: "Perplexity",      tag: "AI Search",     startF: 14, bg: "linear-gradient(135deg,#e8f4fc,#bde0f5)" },
  { icon: <ChatGPTIcon />,    name: "ChatGPT",          tag: "OpenAI",        startF: 19, bg: "linear-gradient(135deg,#e8f7ef,#c0ebd4)" },
  { icon: <GoogleIcon />,     name: "Google AI Mode",   tag: "AI Overviews",  startF: 24, bg: "linear-gradient(135deg,#fff7f0,#fde0c8)" },
];

const Act3: React.FC = () => {
  const f = useCurrentFrame();

  const sceneOp = Math.min(fi(f, 0, 10), fi(f, 118, 130, 1, 0));

  // Label
  const lblOp = fi(f, 4, 16, 0, 1);
  const lblY  = interpolate(f, [4, 16], [14, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  // Glow pulse (sin oscillation)
  const glow = (Math.sin((f / 66) * Math.PI * 2) + 1) / 2;

  return (
    <AbsoluteFill style={{
      opacity: sceneOp,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 20,
    }}>
      {/* Section label with flanking lines */}
      <div style={{
        display: "flex", alignItems: "center", gap: 18,
        opacity: lblOp, transform: `translateY(${lblY}px)`,
        marginBottom: 8, width: 500,
      }}>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(138,138,154,0.35),transparent)" }} />
        <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, letterSpacing: "0.22em", color: GRAY, textTransform: "uppercase" as const }}>
          Be mentioned by
        </span>
        <div style={{ flex: 1, height: 1, background: "linear-gradient(90deg,transparent,rgba(138,138,154,0.35),transparent)" }} />
      </div>

      {/* Platform pills */}
      {PLATFORMS.map((pl, i) => {
        const pf  = f - pl.startF;
        const pOp = fi(pf, 0, 14, 0, 1);
        const pX  = interpolate(pf, [0, 16], [-54, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });
        const pillGlow = pf > 16 ? glow : 0;

        return (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 18,
            background: "rgba(255,255,255,0.84)",
            backdropFilter: "blur(18px)",
            border: "1.5px solid rgba(255,255,255,0.94)",
            borderRadius: 999,
            padding: "16px 52px 16px 22px",
            minWidth: 430,
            boxShadow: `0 8px 32px rgba(0,0,0,0.08), 0 0 ${26 * pillGlow}px ${6 * pillGlow}px rgba(155,111,212,${0.2 * pillGlow})`,
            opacity: pOp,
            transform: `translateX(${pX}px)`,
          }}>
            <div style={{
              width: 50, height: 50, borderRadius: 12, overflow: "hidden", flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: pl.bg,
            }}>
              {pl.icon}
            </div>
            <div>
              <div style={{ fontFamily: sans, fontSize: 26, fontWeight: 700, color: DARK, letterSpacing: -0.5 }}>{pl.name}</div>
              <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: GRAY, letterSpacing: "0.18em", textTransform: "uppercase" as const, marginTop: 2 }}>{pl.tag}</div>
            </div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// ACT 4 — The Brand  (Sequence: from=350, duration=190)
// Logo pill · headline with animated underline · stats · CTA · shimmer
// ══════════════════════════════════════════════════════════════════════════
const Act4: React.FC = () => {
  const f = useCurrentFrame();
  const { fps } = useVideoConfig();

  const sceneOp = fi(f, 0, 8, 0, 1);

  // Deco lines (draw-in)
  const l1 = fi(f, 0, 22, 0, 1, );
  const l2 = fi(f, 4, 26, 0, 1);

  // Logo pill: spring bounce
  const lpSp  = spring({ frame: f - 6, fps, config: { damping: 11, stiffness: 155, mass: 1 } });
  const lpOp  = fi(f, 6, 18, 0, 1);
  const lpY   = interpolate(lpSp, [0, 1], [-40, 0]);
  const lpScl = interpolate(lpSp, [0, 1], [0.93, 1]);

  // Headline
  const hlOp = fi(f, 22, 36, 0, 1);
  const hlY  = interpolate(f, [22, 38], [32, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  // Underline SVG path progress
  const uProg = fi(f, 36, 54);

  // Stat row
  const stOp = fi(f, 52, 66, 0, 1);
  const stY  = interpolate(f, [52, 66], [18, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  // CTA
  const ctaOp = fi(f, 68, 80, 0, 1);
  const ctaY  = interpolate(f, [68, 80], [24, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: snap });

  // Website URL
  const urlOp = fi(f, 82, 94, 0, 1);

  // Shimmer sweep
  const shimX = interpolate(f, [96, 128], [-120, 220], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.cubic),
  });
  const shimOp = f >= 96 && f <= 128 ? 1 : 0;

  // Logo float (once settled)
  const fl = f > 30 ? floatY(f - 30, 3, 190) : 0;

  return (
    <AbsoluteFill style={{ opacity: sceneOp }}>

      {/* Thin horizontal deco lines */}
      <div style={{
        position: "absolute", top: "22%", left: "5%",
        width: `${l1 * 90}%`, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(155,111,212,0.22),transparent)",
      }} />
      <div style={{
        position: "absolute", top: "78%", left: "5%",
        width: `${l2 * 90}%`, height: 1,
        background: "linear-gradient(90deg,transparent,rgba(155,111,212,0.22),transparent)",
      }} />

      {/* Centre column */}
      <AbsoluteFill style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", gap: 34,
      }}>

        {/* Logo pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          background: "rgba(255,255,255,0.80)",
          backdropFilter: "blur(22px)",
          border: "1.5px solid rgba(255,255,255,0.92)",
          borderRadius: 999,
          padding: "10px 32px 10px 16px",
          boxShadow: "0 10px 40px rgba(0,0,0,0.10), 0 2px 10px rgba(0,0,0,0.05)",
          opacity: lpOp,
          transform: `translateY(${lpY + fl}px) scale(${lpScl})`,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
            background: "linear-gradient(135deg,#e879a0,#9b6fd4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, color: "#fff",
          }}>✦</div>
          <div>
            <div style={{ fontFamily: sans, fontSize: 22, fontWeight: 800, color: DARK, letterSpacing: -0.5 }}>
              ShowYourBrand
            </div>
            <div style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, color: GRAY, letterSpacing: "0.18em", textTransform: "uppercase" as const, marginTop: 2 }}>
              Generative Engine Optimization
            </div>
          </div>
        </div>

        {/* Headline */}
        <div style={{
          opacity: hlOp,
          transform: `translateY(${hlY}px)`,
          textAlign: "center",
          lineHeight: 1.04,
          maxWidth: 1400,
        }}>
          <span style={{ fontFamily: serif, fontSize: 96, fontWeight: 600, fontStyle: "italic", color: DARK, letterSpacing: -1 }}>
            Get{" "}
          </span>
          {/* Gradient "mentioned" with animated SVG underline */}
          <span style={{ position: "relative", display: "inline-block" }}>
            <span style={{
              fontFamily: serif, fontSize: 96, fontWeight: 700, fontStyle: "normal",
              letterSpacing: -1,
              color: PURPLE,
            }}>
              mentioned
            </span>
            <svg
              viewBox="0 0 380 20"
              style={{
                position: "absolute", bottom: -8, left: -4,
                width: "calc(100% + 8px)", height: 20, display: "block",
              }}
            >
              <defs>
                <linearGradient id="ug" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor={PURPLE} />
                  <stop offset="100%" stopColor={TEAL} />
                </linearGradient>
              </defs>
              <path
                d="M4,15 Q95,4 190,12 Q285,20 376,8"
                fill="none"
                stroke="url(#ug)"
                strokeWidth={3.5}
                strokeLinecap="round"
                strokeDasharray={400}
                strokeDashoffset={400 * (1 - uProg)}
                opacity={0.85}
              />
            </svg>
          </span>
          <span style={{ fontFamily: serif, fontSize: 96, fontWeight: 600, fontStyle: "italic", color: DARK, letterSpacing: -1 }}>
            {" "}by AI.
          </span>
          <br />
          <span style={{ fontFamily: serif, fontSize: 96, fontWeight: 600, fontStyle: "italic", color: DARK, letterSpacing: -1 }}>
            Everywhere.
          </span>
        </div>

        {/* Stats row */}
        <div style={{
          display: "flex", alignItems: "center", gap: 52,
          opacity: stOp, transform: `translateY(${stY}px)`,
        }}>
          {[
            { num: "3×",   lbl: "More AI Citations"  },
            { num: "+68%", lbl: "Brand Visibility"    },
            { num: "30d",  lbl: "To First Results"    },
          ].map((s, i) => (
            <React.Fragment key={i}>
              {i > 0 && (
                <div style={{ width: 1, height: 50, background: "linear-gradient(180deg,transparent,rgba(155,111,212,0.3),transparent)" }} />
              )}
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 700, color: INDIGO, lineHeight: 1 }}>
                  {s.num}
                </div>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 600, color: GRAY, letterSpacing: "0.18em", textTransform: "uppercase" as const }}>
                  {s.lbl}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* CTA button */}
        <div style={{
          background: DARK, color: "#fff",
          borderRadius: 999,
          padding: "18px 50px",
          fontFamily: sans, fontSize: 20, fontWeight: 700,
          boxShadow: "0 10px 40px rgba(42,42,58,0.28), 0 2px 10px rgba(42,42,58,0.15)",
          opacity: ctaOp, transform: `translateY(${ctaY}px)`,
          display: "flex", alignItems: "center", gap: 10,
          letterSpacing: 0.1,
        }}>
          <span style={{ color: PURPLE }}>◆</span>
          <span>Book a call &amp; Subscribe now</span>
        </div>

        {/* Website URL */}
        <div style={{
          fontFamily: sans, fontSize: 16, fontWeight: 400, color: "#9090a0",
          letterSpacing: "0.08em", opacity: urlOp,
          display: "flex", alignItems: "center", gap: 6,
        }}>
          <span style={{ fontSize: 10, color: PURPLE, opacity: 0.7 }}>◆</span>
          <span>showyourbrand.app</span>
        </div>

      </AbsoluteFill>

      {/* Shimmer sweep */}
      <AbsoluteFill style={{
        background: "linear-gradient(108deg,transparent 18%,rgba(255,255,255,0.24) 48%,rgba(255,255,255,0.12) 52%,transparent 82%)",
        transform: `translateX(${shimX}%)`,
        opacity: shimOp,
        pointerEvents: "none",
        zIndex: 100,
      }} />

    </AbsoluteFill>
  );
};

// ══════════════════════════════════════════════════════════════════════════
// Root — 540 frames = 18 s @ 30 fps
// Acts overlap ≈ 10 frames for smooth crossfades.
// ══════════════════════════════════════════════════════════════════════════
export const SYBVideo_Cinematic: React.FC = () => (
  <AbsoluteFill>
    <BG />
    <Sequence from={0}   durationInFrames={120}><Act1 /></Sequence>
    <Sequence from={110} durationInFrames={130}><Act2 /></Sequence>
    <Sequence from={230} durationInFrames={130}><Act3 /></Sequence>
    <Sequence from={350} durationInFrames={190}><Act4 /></Sequence>
  </AbsoluteFill>
);
