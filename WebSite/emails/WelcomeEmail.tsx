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
  Button,
  Img,
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  language?: "en" | "fr";
}

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  language = "en",
}) => {
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://ShowYourBrand.vercel.app";

  const content =
    language === "fr"
      ? {
          preview: "Bienvenue sur ShowYourBrand - Votre plateforme GEO",
          title: "Bienvenue sur ShowYourBrand!",
          greeting: `Bonjour ${name},`,
          intro:
            "Merci de vous être inscrit sur ShowYourBrand, votre plateforme de GEO (Generative Engine Optimization).",
          whatNext: "Que pouvez-vous faire maintenant ?",
          feature1: "Configurer votre premier projet (site web à auditer)",
          feature2: "Lancer un audit GEO sur 100 prompts IA",
          feature3:
            "Recevoir des recommandations pour améliorer votre visibilité IA",
          ctaText: "Accéder au tableau de bord",
          support:
            "Des questions ? Répondez directement à cet email, nous lisons tout.",
          signature: "L'équipe ShowYourBrand",
        }
      : {
          preview: "Welcome to ShowYourBrand - Your GEO Platform",
          title: "Welcome to ShowYourBrand!",
          greeting: `Hello ${name},`,
          intro:
            "Thank you for signing up for ShowYourBrand, the first Generative Engine Optimization (GEO) platform.",
          whatNext: "What can you do now?",
          feature1: "Set up your first project (website to audit)",
          feature2: "Run a GEO audit across 100 AI prompts",
          feature3: "Get recommendations to improve your AI visibility",
          ctaText: "Go to Dashboard",
          support:
            "Questions? Just reply to this email; we read every message.",
          signature: "The ShowYourBrand Team",
        };

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
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
            <Heading style={contentTitle}>{content.title}</Heading>
            <Text style={greeting}>{content.greeting}</Text>
            <Text style={paragraph}>{content.intro}</Text>

            <Heading as="h3" style={sectionTitle}>
              {content.whatNext}
            </Heading>

            <Section style={featureList}>
              <Text style={featureItem}>
                <span style={featureNumber}>01</span> {content.feature1}
              </Text>
              <Text style={featureItem}>
                <span style={featureNumber}>02</span> {content.feature2}
              </Text>
              <Text style={featureItem}>
                <span style={featureNumber}>03</span> {content.feature3}
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={`${baseUrl}/dashboard`} style={ctaButton}>
                {content.ctaText} →
              </Button>
            </Section>

            <Text style={paragraph}>{content.support}</Text>

            <Text style={signature}>
              {language === "fr" ? "Cordialement," : "Best regards,"}
              <br />
              <strong>{content.signature}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerBrand}>ShowYourBrand</Text>
            <Text style={footerText}>
              {language === "fr"
                ? "Rendez votre marque visible dans les moteurs de recherche IA"
                : "Make your brand visible in AI search engines"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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

const sectionTitle = {
  color: "#1E293B",
  fontSize: "15px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const featureList = {
  backgroundColor: "#fff7ed",
  padding: "16px 20px",
  borderRadius: "10px",
  border: "1px solid #fed7aa",
  margin: "0 0 24px",
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

const ctaSection = {
  textAlign: "center" as const,
  margin: "28px 0",
};

const ctaButton = {
  backgroundColor: "#1E293B",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "50px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  display: "inline-block",
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
  margin: "0",
};
