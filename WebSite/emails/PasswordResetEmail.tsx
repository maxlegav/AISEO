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

interface PasswordResetEmailProps {
  name: string;
  resetUrl: string;
  language?: "en" | "fr";
}

const PasswordResetEmail: React.FC<PasswordResetEmailProps> = ({
  name,
  resetUrl,
  language = "en",
}) => {
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://showyourbrand.vercel.app";

  const content =
    language === "fr"
      ? {
          preview: "Réinitialisation de votre mot de passe ShowYourBrand",
          title: "Réinitialisation du mot de passe",
          greeting: `Bonjour ${name},`,
          intro:
            "Nous avons reçu une demande de réinitialisation de votre mot de passe pour votre compte ShowYourBrand.",
          action:
            "Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :",
          ctaText: "Réinitialiser le mot de passe",
          expiry: "Ce lien expirera dans 1 heure.",
          noRequest:
            "Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe restera inchangé.",
          security:
            "Pour votre sécurité, ne partagez jamais ce lien avec personne.",
          signature: "L'équipe ShowYourBrand",
        }
      : {
          preview: "Reset your ShowYourBrand password",
          title: "Password Reset Request",
          greeting: `Hello ${name},`,
          intro:
            "We received a request to reset your password for your ShowYourBrand account.",
          action: "Click the button below to create a new password:",
          ctaText: "Reset Password",
          expiry: "This link will expire in 1 hour.",
          noRequest:
            "If you did not request this, you can safely ignore this email. Your password will remain unchanged.",
          security: "For your security, never share this link with anyone.",
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
            <Text style={paragraph}>{content.action}</Text>

            <Section style={ctaSection}>
              <Button href={resetUrl} style={ctaButton}>
                {content.ctaText} →
              </Button>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                ⏱ <strong>{language === "fr" ? "Important :" : "Important:"}</strong>{" "}
                {content.expiry}
              </Text>
            </Section>

            <Text style={paragraph}>{content.noRequest}</Text>
            <Text style={securityNote}>🔒 {content.security}</Text>

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
                ? "Cet email a été envoyé suite à une demande de réinitialisation de mot de passe."
                : "This email was sent because a password reset was requested."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

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

const warningBox = {
  backgroundColor: "#fff7ed",
  padding: "14px 18px",
  borderRadius: "10px",
  border: "1px solid #fed7aa",
  margin: "0 0 16px",
};

const warningText = {
  color: "#c2410c",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const securityNote = {
  color: "#9ca3af",
  fontSize: "12px",
  fontStyle: "italic" as const,
  lineHeight: "18px",
  margin: "0 0 20px",
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
