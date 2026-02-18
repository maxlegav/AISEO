import * as React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
  Img,
} from "@react-email/components";

interface WaitlistWelcomeEmailProps {
  email: string;
}

const WaitlistWelcomeEmail: React.FC<WaitlistWelcomeEmailProps> = ({
  email,
}) => {
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://showyourbrand.vercel.app";

  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the ShowYourBrand waitlist! 🎉</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Gradient header */}
          <Section style={headerBanner}>
            <Img
              src={`${baseUrl}/syb_logo_transparent.png`}
              alt="ShowYourBrand"
              width="56"
              height="56"
              style={logoImg}
            />
            <Text style={brandName}>ShowYourBrand</Text>
            <Text style={brandTagline}>Generative Engine Optimization</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={contentTitle}>You&apos;re on the list!</Heading>
            <Text style={greeting}>Hey there,</Text>
            <Text style={paragraph}>
              Thanks for joining the ShowYourBrand waitlist! We&apos;re building
              the first Generative Engine Optimization (GEO) platform to help
              brands become visible in AI search engines like ChatGPT, Claude,
              Perplexity, and more.
            </Text>

            <Text style={paragraph}>
              You&apos;re among the first to sign up, and we&apos;ll make sure
              you&apos;re the first to know when we launch. Early members get
              exclusive access and special pricing.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightTitle}>What to expect next:</Text>
              <Text style={featureItem}>
                <span style={featureNumber}>01</span> Early access invitation
                before public launch
              </Text>
              <Text style={featureItem}>
                <span style={featureNumber}>02</span> Exclusive founding member
                pricing
              </Text>
              <Text style={featureItem}>
                <span style={featureNumber}>03</span> Priority onboarding and
                support
              </Text>
            </Section>

            <Text style={paragraph}>
              In the meantime, feel free to reply to this email if you have any
              questions. We read every message.
            </Text>

            <Text style={signature}>
              See you soon,
              <br />
              <strong>The ShowYourBrand Team</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerBrand}>ShowYourBrand</Text>
            <Text style={footerText}>
              Make your brand visible in AI search engines
            </Text>
            <Text style={footerTextSmall}>
              You received this email because {email} joined our waitlist.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitlistWelcomeEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f8f8f8",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  borderRadius: "16px",
  overflow: "hidden" as const,
  maxWidth: "600px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
};

const headerBanner = {
  background: "linear-gradient(135deg, #ddd6fe 0%, #fce7f3 55%, #fed7aa 100%)",
  padding: "36px 32px 28px",
  textAlign: "center" as const,
};

const logoImg = {
  display: "block",
  margin: "0 auto 12px",
  borderRadius: "12px",
};

const brandName = {
  color: "#1E293B",
  fontSize: "22px",
  fontWeight: "700",
  lineHeight: "28px",
  margin: "0 0 4px",
  letterSpacing: "-0.3px",
};

const brandTagline = {
  color: "#7c3aed",
  fontSize: "12px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0",
};

const contentSection = {
  padding: "32px 36px 8px",
};

const contentTitle = {
  color: "#1E293B",
  fontSize: "26px",
  fontWeight: "700",
  lineHeight: "34px",
  margin: "0 0 20px",
  letterSpacing: "-0.3px",
};

const greeting = {
  color: "#1E293B",
  fontSize: "15px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 12px",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const highlightBox = {
  backgroundColor: "#fff7ed",
  padding: "16px 20px",
  borderRadius: "10px",
  border: "1px solid #fed7aa",
  margin: "0 0 24px",
};

const highlightTitle = {
  color: "#c2410c",
  fontSize: "13px",
  fontWeight: "700" as const,
  letterSpacing: "0.05em",
  textTransform: "uppercase" as const,
  margin: "0 0 10px",
};

const featureItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "26px",
  margin: "0",
};

const featureNumber = {
  color: "#f97316",
  fontWeight: "700" as const,
  marginRight: "8px",
};

const signature = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0 28px",
};

const divider = {
  borderColor: "#f3f4f6",
  margin: "0",
};

const footer = {
  padding: "20px 36px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
  borderTop: "3px solid #fed7aa",
};

const footerBrand = {
  color: "#1E293B",
  fontSize: "13px",
  fontWeight: "700",
  margin: "0 0 4px",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "11px",
  lineHeight: "16px",
  margin: "0 0 4px",
};

const footerTextSmall = {
  color: "#d1d5db",
  fontSize: "10px",
  lineHeight: "14px",
  margin: "8px 0 0",
};
