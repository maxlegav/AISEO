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
  const content =
    language === "fr"
      ? {
          preview: "Reinitialisation de votre mot de passe ShowYourBrand",
          title: "Reinitialisation du mot de passe",
          greeting: `Bonjour ${name},`,
          intro:
            "Nous avons recu une demande de reinitialisation de votre mot de passe pour votre compte ShowYourBrand.",
          action:
            "Cliquez sur le bouton ci-dessous pour creer un nouveau mot de passe:",
          ctaText: "Reinitialiser le mot de passe",
          expiry: "Ce lien expirera dans 1 heure.",
          noRequest:
            "Si vous n'avez pas demande cette reinitialisation, vous pouvez ignorer cet email. Votre mot de passe restera inchange.",
          security:
            "Pour des raisons de securite, ne partagez jamais ce lien avec personne.",
          signature: "L'equipe ShowYourBrand",
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
            "If you did not request this reset, you can safely ignore this email. Your password will remain unchanged.",
          security: "For security reasons, never share this link with anyone.",
          signature: "The ShowYourBrand Team",
        };

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
            <Text style={paragraph}>{content.action}</Text>

            <Section style={ctaSection}>
              <Button href={resetUrl} style={ctaButton}>
                {content.ctaText}
              </Button>
            </Section>

            <Section style={warningBox}>
              <Text style={warningText}>
                <strong>
                  {language === "fr" ? "Important:" : "Important:"}
                </strong>{" "}
                {content.expiry}
              </Text>
            </Section>

            <Text style={paragraph}>{content.noRequest}</Text>
            <Text style={securityNote}>{content.security}</Text>

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
                ? "Cet email a ete envoye car une reinitialisation de mot de passe a ete demandee."
                : "This email was sent because a password reset was requested."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default PasswordResetEmail;

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

const ctaSection = {
  textAlign: "center" as const,
  margin: "24px 0",
};

const ctaButton = {
  backgroundColor: "#1E293B",
  color: "#ffffff",
  padding: "14px 28px",
  borderRadius: "8px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
};

const warningBox = {
  backgroundColor: "#fef3c7",
  padding: "12px 16px",
  borderRadius: "8px",
  border: "1px solid #fcd34d",
  margin: "16px 0",
};

const warningText = {
  color: "#92400e",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
};

const securityNote = {
  color: "#6b7280",
  fontSize: "13px",
  fontStyle: "italic" as const,
  lineHeight: "20px",
  margin: "0 0 16px",
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
