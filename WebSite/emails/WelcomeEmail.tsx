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
} from "@react-email/components";

interface WelcomeEmailProps {
  name: string;
  language?: "en" | "fr";
}

const WelcomeEmail: React.FC<WelcomeEmailProps> = ({
  name,
  language = "en",
}) => {
  const content =
    language === "fr"
      ? {
          preview: "Bienvenue sur ShowYourBrand - Votre plateforme GEO",
          title: "Bienvenue sur ShowYourBrand!",
          greeting: `Bonjour ${name},`,
          intro:
            "Merci de vous etre inscrit sur ShowYourBrand, votre plateforme de GEO (Generative Engine Optimization).",
          whatNext: "Que pouvez-vous faire maintenant?",
          feature1: "Configurer votre premier projet (site web a auditer)",
          feature2: "Lancer un audit GEO sur 100 prompts IA",
          feature3:
            "Recevoir des recommandations pour ameliorer votre visibilite IA",
          ctaText: "Acceder au tableau de bord",
          support:
            "Si vous avez des questions, n'hesitez pas a nous contacter.",
          signature: "L'equipe ShowYourBrand",
        }
      : {
          preview: "Welcome to ShowYourBrand - Your GEO Platform",
          title: "Welcome to ShowYourBrand!",
          greeting: `Hello ${name},`,
          intro:
            "Thank you for signing up for ShowYourBrand, your GEO (Generative Engine Optimization) platform.",
          whatNext: "What can you do now?",
          feature1: "Set up your first project (website to audit)",
          feature2: "Run a GEO audit across 100 AI prompts",
          feature3: "Get recommendations to improve your AI visibility",
          ctaText: "Go to Dashboard",
          support: "If you have any questions, feel free to reach out to us.",
          signature: "The ShowYourBrand Team",
        };

  const baseUrl = process.env.NEXTAUTH_URL || "https://ShowYourBrand.com";

  return (
    <Html>
      <Head />
      <Preview>{content.preview}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoContainer}>
              <span style={logoText}>AI</span>
            </div>
            <Heading style={headerTitle}>{content.title}</Heading>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={greeting}>{content.greeting}</Text>
            <Text style={paragraph}>{content.intro}</Text>

            <Heading as="h3" style={sectionTitle}>
              {content.whatNext}
            </Heading>

            <Section style={featureList}>
              <Text style={featureItem}>1. {content.feature1}</Text>
              <Text style={featureItem}>2. {content.feature2}</Text>
              <Text style={featureItem}>3. {content.feature3}</Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={`${baseUrl}/dashboard`} style={ctaButton}>
                {content.ctaText}
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
            <Text style={footerText}>ShowYourBrand - GEO Audit Platform</Text>
            <Text style={footerText}>
              {language === "fr"
                ? "Rendez votre entreprise visible dans les moteurs de recherche IA"
                : "Make your business visible in AI search engines"}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,segoe ui,roboto,oxygen,ubuntu,cantarell,open sans,helvetica neue,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 32px 24px",
  textAlign: "center" as const,
};

const logoContainer = {
  width: "48px",
  height: "48px",
  background: "linear-gradient(135deg, #9333ea 0%, #ec4899 100%)",
  borderRadius: "12px",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "16px",
};

const logoText = {
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "700",
};

const headerTitle = {
  color: "#1E293B",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0",
};

const divider = {
  borderColor: "#e1e8ed",
  margin: "24px 0",
};

const contentSection = {
  padding: "0 32px",
};

const greeting = {
  color: "#1E293B",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 16px",
};

const sectionTitle = {
  color: "#1E293B",
  fontSize: "16px",
  fontWeight: "600",
  margin: "24px 0 12px",
};

const featureList = {
  backgroundColor: "#f9fafb",
  padding: "16px 20px",
  borderRadius: "8px",
  border: "1px solid #e5e7eb",
  margin: "0 0 24px",
};

const featureItem = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "24px",
  margin: "0 0 8px",
};

const ctaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const ctaButton = {
  backgroundColor: "#1E293B",
  color: "#ffffff",
  padding: "12px 24px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
};

const signature = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "24px 0 0",
};

const footer = {
  padding: "0 32px",
  textAlign: "center" as const,
};

const footerText = {
  color: "#6b7280",
  fontSize: "12px",
  lineHeight: "16px",
  margin: "0 0 4px",
};
