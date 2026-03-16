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

// ─── Timing (frames @ 30fps) ───────────────────────────────────────────────
// Scene 1 — Logo reveal:       0 → 60   (2s)
// Scene 2 — ChatGPT query:    60 → 180  (4s)
// Scene 3 — AI response card: 180 → 450 (9s)
// Scene 4 — CTA outro:        450 → 540 (3s)

// ─── Colors ───────────────────────────────────────────────────────────────
const PURPLE = "#7C3AED";
const LIGHT_PURPLE = "#EDE9FE";
const DARK = "#1E293B";
const WHITE = "#FFFFFF";
const GRAY_100 = "#F3F4F6";
const GRAY_200 = "#E5E7EB";
const GRAY_400 = "#9CA3AF";
const GRAY_600 = "#4B5563";
const GREEN = "#22C55E";

// ─── Helpers ──────────────────────────────────────────────────────────────
function useSpring(frame: number, delay = 0, config = { damping: 18, stiffness: 90 }) {
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
}

function fadeIn(frame: number, start: number, duration = 15) {
  return interpolate(frame, [start, start + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
}

function slideUp(frame: number, start: number, distance = 30) {
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - start, fps, config: { damping: 20, stiffness: 100 } });
  return interpolate(progress, [0, 1], [distance, 0]);
}

// ─── Typewriter component ─────────────────────────────────────────────────
const Typewriter: React.FC<{ text: string; startFrame: number; charsPerFrame?: number }> = ({
  text,
  startFrame,
  charsPerFrame = 0.7,
}) => {
  const frame = useCurrentFrame();
  const elapsed = Math.max(0, frame - startFrame);
  const chars = Math.floor(elapsed * charsPerFrame);
  const displayed = text.slice(0, chars);
  const showCursor = chars < text.length;

  return (
    <span>
      {displayed}
      {showCursor && (
        <span
          style={{
            display: "inline-block",
            width: 2,
            height: "1em",
            backgroundColor: DARK,
            marginLeft: 2,
            verticalAlign: "text-bottom",
            opacity: Math.floor(frame / 10) % 2 === 0 ? 1 : 0,
          }}
        />
      )}
    </span>
  );
};

// ─── AI Loading dots ──────────────────────────────────────────────────────
const LoadingDots: React.FC<{ frame: number }> = ({ frame }) => {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "16px 20px" }}>
      {[0, 1, 2].map((i) => {
        const bounce = Math.sin((frame / 8 + i * 0.8) * Math.PI);
        return (
          <div
            key={i}
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              backgroundColor: GRAY_400,
              transform: `translateY(${bounce * -5}px)`,
              opacity: 0.5 + bounce * 0.4,
            }}
          />
        );
      })}
    </div>
  );
};

// ─── Stat row in the card ─────────────────────────────────────────────────
const StatRow: React.FC<{
  emoji: string;
  text: string;
  frame: number;
  delay: number;
}> = ({ emoji, text, frame, delay }) => {
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 100 } });
  const opacity = interpolate(frame, [delay, delay + 15], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateX = interpolate(progress, [0, 1], [-20, 0]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity,
        transform: `translateX(${translateX}px)`,
        padding: "6px 0",
      }}
    >
      <span style={{ fontSize: 24 }}>{emoji}</span>
      <span style={{ fontSize: 22, color: GRAY_600, fontFamily: "sans-serif" }}>{text}</span>
    </div>
  );
};

// ─── AI Engine Badge ──────────────────────────────────────────────────────
const AIBadge: React.FC<{ name: string; color: string; frame: number; delay: number }> = ({
  name,
  color,
  frame,
  delay,
}) => {
  const { fps } = useVideoConfig();
  const progress = spring({ frame: frame - delay, fps, config: { damping: 22, stiffness: 120 } });
  const scale = interpolate(progress, [0, 1], [0.6, 1]);
  const opacity = interpolate(frame, [delay, delay + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        backgroundColor: color + "18",
        border: `1.5px solid ${color}40`,
        borderRadius: 100,
        padding: "6px 16px",
        transform: `scale(${scale})`,
        opacity,
      }}
    >
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          backgroundColor: color,
        }}
      />
      <span style={{ fontSize: 18, color, fontWeight: 600, fontFamily: "sans-serif" }}>{name}</span>
    </div>
  );
};

// ─── Scene 1: Logo Reveal ─────────────────────────────────────────────────
const SceneLogoReveal: React.FC = () => {
  const frame = useCurrentFrame();

  const logoScale = spring({ frame, fps: 30, config: { damping: 20, stiffness: 80 } });
  const logoOpacity = fadeIn(frame, 0, 20);
  const taglineOpacity = fadeIn(frame, 25, 20);
  const taglineY = interpolate(frame, [25, 45], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 50%, #FEF3C7 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 28,
      }}
    >
      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <Img
          src={staticFile("syb_logo_transparent.png")}
          style={{ width: 80, height: 80, objectFit: "contain" }}
        />
        <span
          style={{
            fontSize: 60,
            fontWeight: 700,
            color: DARK,
            fontFamily: "sans-serif",
            letterSpacing: -1,
          }}
        >
          ShowYourBrand
        </span>
      </div>

      {/* Tagline */}
      <div
        style={{
          opacity: taglineOpacity,
          transform: `translateY(${taglineY}px)`,
          fontSize: 28,
          color: GRAY_600,
          fontFamily: "sans-serif",
          fontStyle: "italic",
        }}
      >
        The GEO platform to dominate AI search
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: ChatGPT Query ────────────────────────────────────────────────
const SceneChatQuery: React.FC = () => {
  const frame = useCurrentFrame();

  const QUERY = "What's the best platform to optimize my brand visibility on AI search?";

  const windowOpacity = fadeIn(frame, 0, 20);
  const windowScale = interpolate(
    spring({ frame, fps: 30, config: { damping: 22, stiffness: 90 } }),
    [0, 1],
    [0.96, 1]
  );

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 50%, #FEF3C7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Browser window */}
      <div
        style={{
          width: 1280,
          backgroundColor: WHITE,
          borderRadius: 16,
          boxShadow: "0 40px 120px rgba(0,0,0,0.18)",
          overflow: "hidden",
          opacity: windowOpacity,
          transform: `scale(${windowScale})`,
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            backgroundColor: "#F9FAFB",
            borderBottom: `1px solid ${GRAY_200}`,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: c }} />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: GRAY_100,
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 15,
              color: GRAY_600,
              fontFamily: "sans-serif",
              maxWidth: 500,
            }}
          >
            chatgpt.com
          </div>
        </div>

        {/* Chat area */}
        <div style={{ padding: "40px 80px 32px", minHeight: 480 }}>
          {/* ChatGPT top bar */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 40,
            }}
          >
            <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "sans-serif", color: DARK }}>
              ChatGPT
            </span>
            <span style={{ fontSize: 16, color: GRAY_400, fontFamily: "sans-serif" }}>4o</span>
          </div>

          {/* User message */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              marginBottom: 32,
              opacity: fadeIn(frame, 10, 15),
            }}
          >
            <div
              style={{
                backgroundColor: "#F4F4F5",
                borderRadius: "20px 20px 4px 20px",
                padding: "14px 22px",
                maxWidth: 740,
                fontSize: 22,
                fontFamily: "sans-serif",
                color: DARK,
                lineHeight: 1.5,
              }}
            >
              <Typewriter text={QUERY} startFrame={15} charsPerFrame={1.2} />
            </div>
          </div>

          {/* Loading indicator */}
          <div style={{ opacity: fadeIn(frame, 60, 10) }}>
            <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: "50%",
                  backgroundColor: "#10A37F",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 18, color: WHITE, fontWeight: 700 }}>G</span>
              </div>
              <LoadingDots frame={frame - 60} />
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div
          style={{
            borderTop: `1px solid ${GRAY_200}`,
            padding: "16px 80px",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: GRAY_100,
              borderRadius: 100,
              padding: "14px 24px",
              fontSize: 18,
              color: GRAY_400,
              fontFamily: "sans-serif",
            }}
          >
            Message ChatGPT
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: AI Response with ShowYourBrand Card ─────────────────────────
const SceneAIResponse: React.FC = () => {
  const frame = useCurrentFrame();

  const RESPONSE_TEXT = "Based on current GEO tools, here's the top recommendation:";

  const windowOpacity = 1;

  // Response text appears first
  const responseOpacity = fadeIn(frame, 0, 15);

  // Card slides up after response text
  const cardSpring = spring({ frame: frame - 30, fps: 30, config: { damping: 22, stiffness: 80 } });
  const cardOpacity = fadeIn(frame, 30, 20);
  const cardY = interpolate(cardSpring, [0, 1], [40, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #EDE9FE 0%, #FCE7F3 50%, #FEF3C7 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 1280,
          backgroundColor: WHITE,
          borderRadius: 16,
          boxShadow: "0 40px 120px rgba(0,0,0,0.18)",
          overflow: "hidden",
        }}
      >
        {/* Browser chrome */}
        <div
          style={{
            backgroundColor: "#F9FAFB",
            borderBottom: `1px solid ${GRAY_200}`,
            padding: "14px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", gap: 8 }}>
            {["#FF5F57", "#FFBD2E", "#28C840"].map((c, i) => (
              <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", backgroundColor: c }} />
            ))}
          </div>
          <div
            style={{
              flex: 1,
              backgroundColor: GRAY_100,
              borderRadius: 8,
              padding: "6px 14px",
              fontSize: 15,
              color: GRAY_600,
              fontFamily: "sans-serif",
              maxWidth: 500,
            }}
          >
            chatgpt.com
          </div>
        </div>

        {/* Chat area */}
        <div style={{ padding: "32px 80px 20px" }}>
          {/* User message (small, already sent) */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 28 }}>
            <div
              style={{
                backgroundColor: "#F4F4F5",
                borderRadius: "20px 20px 4px 20px",
                padding: "10px 18px",
                fontSize: 17,
                fontFamily: "sans-serif",
                color: GRAY_400,
              }}
            >
              What&apos;s the best platform to optimize my brand visibility on AI search?
            </div>
          </div>

          {/* AI response */}
          <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
            {/* ChatGPT avatar */}
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: "50%",
                backgroundColor: "#10A37F",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                marginTop: 2,
              }}
            >
              <span style={{ fontSize: 18, color: WHITE, fontWeight: 700 }}>G</span>
            </div>

            <div style={{ flex: 1 }}>
              {/* Response text */}
              <div
                style={{
                  fontSize: 20,
                  fontFamily: "sans-serif",
                  color: DARK,
                  lineHeight: 1.6,
                  marginBottom: 20,
                  opacity: responseOpacity,
                }}
              >
                {RESPONSE_TEXT}
              </div>

              {/* ShowYourBrand Card */}
              <div
                style={{
                  opacity: cardOpacity,
                  transform: `translateY(${cardY}px)`,
                  backgroundColor: WHITE,
                  border: `2px solid ${LIGHT_PURPLE}`,
                  borderRadius: 16,
                  padding: "28px 32px",
                  boxShadow: "0 4px 24px rgba(124,58,237,0.10)",
                  display: "flex",
                  gap: 40,
                }}
              >
                {/* Left: logo + title + stats */}
                <div style={{ flex: 1 }}>
                  {/* Logo + Name */}
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 14,
                      marginBottom: 10,
                      opacity: fadeIn(frame, 35, 15),
                    }}
                  >
                    <Img
                      src={staticFile("syb_logo_transparent.png")}
                      style={{ width: 44, height: 44, objectFit: "contain" }}
                    />
                    <span
                      style={{
                        fontSize: 30,
                        fontWeight: 700,
                        color: DARK,
                        fontFamily: "sans-serif",
                      }}
                    >
                      ShowYourBrand
                    </span>
                  </div>

                  {/* Tagline */}
                  <div
                    style={{
                      fontSize: 18,
                      fontStyle: "italic",
                      color: GRAY_600,
                      fontFamily: "sans-serif",
                      marginBottom: 22,
                      opacity: fadeIn(frame, 45, 15),
                    }}
                  >
                    The #1 GEO platform to appear in AI search results
                  </div>

                  <div
                    style={{
                      height: 1,
                      backgroundColor: GRAY_200,
                      marginBottom: 16,
                      opacity: fadeIn(frame, 50, 15),
                    }}
                  />

                  {/* Stats */}
                  <StatRow emoji="⚡" text="100+ AI prompts tested per audit" frame={frame} delay={55} />
                  <StatRow emoji="🤖" text="4 AI engines: ChatGPT, Claude, Perplexity, DeepSeek" frame={frame} delay={75} />
                  <StatRow emoji="📊" text="GEO Health Score 0–100%" frame={frame} delay={95} />
                  <StatRow emoji="🏆" text="Competitor visibility comparison" frame={frame} delay={115} />
                  <StatRow emoji="🔴" text="87% of brands are invisible to AI" frame={frame} delay={135} />
                </div>

                {/* Right: GEO Score visual */}
                <div
                  style={{
                    width: 260,
                    flexShrink: 0,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    opacity: fadeIn(frame, 60, 20),
                  }}
                >
                  {/* Score ring */}
                  <div
                    style={{
                      backgroundColor: LIGHT_PURPLE,
                      borderRadius: 16,
                      padding: "24px 16px",
                      textAlign: "center",
                    }}
                  >
                    <div
                      style={{
                        fontSize: 56,
                        fontWeight: 800,
                        color: PURPLE,
                        fontFamily: "sans-serif",
                        lineHeight: 1,
                      }}
                    >
                      {Math.round(
                        interpolate(frame, [60, 130], [0, 73], {
                          extrapolateLeft: "clamp",
                          extrapolateRight: "clamp",
                          easing: Easing.out(Easing.cubic),
                        })
                      )}
                      <span style={{ fontSize: 28, color: GRAY_400 }}>%</span>
                    </div>
                    <div style={{ fontSize: 16, color: GRAY_600, fontFamily: "sans-serif", marginTop: 4 }}>
                      GEO Health Score
                    </div>
                    <div style={{ fontSize: 14, color: "#F97316", fontFamily: "sans-serif", marginTop: 4, fontWeight: 600 }}>
                      Room for improvement →
                    </div>
                  </div>

                  {/* AI engines badges */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    <AIBadge name="ChatGPT" color="#10A37F" frame={frame} delay={80} />
                    <AIBadge name="Claude" color="#D97706" frame={frame} delay={95} />
                    <AIBadge name="Perplexity" color={PURPLE} frame={frame} delay={110} />
                    <AIBadge name="DeepSeek" color="#2563EB" frame={frame} delay={125} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Input bar */}
        <div
          style={{
            borderTop: `1px solid ${GRAY_200}`,
            padding: "14px 80px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <div
            style={{
              flex: 1,
              backgroundColor: GRAY_100,
              borderRadius: 100,
              padding: "12px 24px",
              fontSize: 17,
              color: GRAY_400,
              fontFamily: "sans-serif",
            }}
          >
            Message ChatGPT
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 4: CTA Outro ────────────────────────────────────────────────────
const SceneCTAOutro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const logoProgress = spring({ frame, fps, config: { damping: 20, stiffness: 80 } });
  const logoScale = interpolate(logoProgress, [0, 1], [0.8, 1]);
  const logoOpacity = fadeIn(frame, 0, 20);

  const headlineOpacity = fadeIn(frame, 20, 20);
  const headlineY = interpolate(frame, [20, 40], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.cubic),
  });

  const subOpacity = fadeIn(frame, 35, 20);
  const urlOpacity = fadeIn(frame, 55, 20);

  const ctaProgress = spring({ frame: frame - 50, fps, config: { damping: 18, stiffness: 80 } });
  const ctaScale = interpolate(ctaProgress, [0, 1], [0.85, 1]);
  const ctaOpacity = fadeIn(frame, 50, 20);

  // Pulsing glow on CTA
  const pulse = Math.sin((frame / 20) * Math.PI) * 0.15 + 0.85;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(135deg, #1E293B 0%, #312E81 60%, #1E293B 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 32,
      }}
    >
      {/* Decorative blobs */}
      <div
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 500,
          height: 500,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.3) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -100,
          right: -100,
          width: 600,
          height: 600,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.2) 0%, transparent 70%)",
        }}
      />

      {/* Logo */}
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          display: "flex",
          alignItems: "center",
          gap: 18,
          position: "relative",
        }}
      >
        <Img
          src={staticFile("syb_logo_transparent.png")}
          style={{
            width: 72,
            height: 72,
            objectFit: "contain",
            filter: "brightness(0) invert(1)",
          }}
        />
        <span
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: WHITE,
            fontFamily: "sans-serif",
            letterSpacing: -1,
          }}
        >
          ShowYourBrand
        </span>
      </div>

      {/* Headline */}
      <div
        style={{
          opacity: headlineOpacity,
          transform: `translateY(${headlineY}px)`,
          fontSize: 48,
          fontWeight: 700,
          color: WHITE,
          fontFamily: "sans-serif",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: 960,
        }}
      >
        Make your brand visible
        <br />
        <span style={{ color: "#C4B5FD" }}>in every AI answer</span>
      </div>

      {/* Sub */}
      <div
        style={{
          opacity: subOpacity,
          fontSize: 24,
          color: "#94A3B8",
          fontFamily: "sans-serif",
          textAlign: "center",
          maxWidth: 700,
          lineHeight: 1.6,
        }}
      >
        58% of consumers now search on ChatGPT, Claude or Perplexity.
        <br />
        If AI doesn't mention you —{" "}
        <strong style={{ color: WHITE }}>you don't exist.</strong>
      </div>

      {/* CTA Button */}
      <div
        style={{
          opacity: ctaOpacity,
          transform: `scale(${ctaScale})`,
        }}
      >
        <div
          style={{
            backgroundColor: WHITE,
            color: DARK,
            borderRadius: 100,
            padding: "20px 56px",
            fontSize: 26,
            fontWeight: 700,
            fontFamily: "sans-serif",
            boxShadow: `0 0 ${40 * pulse}px ${20 * pulse}px rgba(196,181,253,0.35)`,
            letterSpacing: -0.5,
          }}
        >
          Start your free GEO audit →
        </div>
      </div>

      {/* URL */}
      <div
        style={{
          opacity: urlOpacity,
          fontSize: 20,
          color: "#64748B",
          fontFamily: "sans-serif",
          letterSpacing: 1,
        }}
      >
        showyourbrand.com
      </div>
    </AbsoluteFill>
  );
};

// ─── Main video ────────────────────────────────────────────────────────────
export const SYBVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Scene 1: Logo reveal (0 → 60) */}
      <Sequence from={0} durationInFrames={60}>
        <SceneLogoReveal />
      </Sequence>

      {/* Scene 2: ChatGPT query (60 → 180) */}
      <Sequence from={60} durationInFrames={120}>
        <SceneChatQuery />
      </Sequence>

      {/* Scene 3: AI response card (180 → 450) */}
      <Sequence from={180} durationInFrames={270}>
        <SceneAIResponse />
      </Sequence>

      {/* Scene 4: CTA outro (450 → 540) */}
      <Sequence from={450} durationInFrames={90}>
        <SceneCTAOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
