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

interface SubscriptionConfirmationEmailProps {
  name: string;
  tier: string;
  amount: number;
  currency: string;
  language?: "en" | "fr";
}

const SubscriptionConfirmationEmail: React.FC<
  SubscriptionConfirmationEmailProps
> = ({ name, tier, amount, currency, language = "en" }) => {
  const formattedAmount = new Intl.NumberFormat(
    language === "fr" ? "fr-FR" : "en-US",
    {
      style: "currency",
      currency: currency.toUpperCase(),
    },
  ).format(amount / 100);

  const tierDisplayName =
    {
      basic:
        language === "fr" ? "Basic (Audit Unique)" : "Basic (One-Time Audit)",
      pro: language === "fr" ? "Pro (Audit Unique)" : "Pro (One-Time Audit)",
      premium: "Premium",
    }[tier.toLowerCase()] || tier;

  // Basic and Pro are one-shot purchases, Premium is subscription
  const isOneShot =
    tier.toLowerCase() === "basic" || tier.toLowerCase() === "pro";

  const content =
    language === "fr"
      ? {
          preview: isOneShot
            ? "Confirmation de votre achat ShowYourBrand"
            : "Confirmation de votre abonnement ShowYourBrand",
          title: isOneShot ? "Achat confirme!" : "Abonnement active!",
          greeting: `Bonjour ${name},`,
          intro: isOneShot
            ? "Merci pour votre achat. Votre audit GEO est maintenant disponible."
            : `Merci pour votre abonnement. Votre plan ${tierDisplayName} est maintenant actif.`,
          details: "Details de votre achat:",
          planLabel: "Plan:",
          amountLabel: isOneShot ? "Montant:" : "Montant mensuel:",
          whatNext: isOneShot
            ? "Vous disposez maintenant de 1 credit d'audit. Lancez votre premier audit GEO des maintenant!"
            : "Vous pouvez maintenant profiter de toutes les fonctionnalites de votre plan.",
          ctaText: "Acceder au tableau de bord",
          support:
            "Si vous avez des questions concernant votre abonnement, n'hesitez pas a nous contacter.",
          signature: "L'equipe ShowYourBrand",
        }
      : {
          preview: isOneShot
            ? "Your ShowYourBrand purchase is confirmed"
            : "Your ShowYourBrand subscription is confirmed",
          title: isOneShot ? "Purchase Confirmed!" : "Subscription Activated!",
          greeting: `Hello ${name},`,
          intro: isOneShot
            ? "Thank you for your purchase. Your GEO audit is now available."
            : `Thank you for subscribing. Your ${tierDisplayName} plan is now active.`,
          details: "Purchase details:",
          planLabel: "Plan:",
          amountLabel: isOneShot ? "Amount:" : "Monthly amount:",
          whatNext: isOneShot
            ? "You now have 1 audit credit. Start your first GEO audit now!"
            : "You can now enjoy all the features of your plan.",
          ctaText: "Go to Dashboard",
          support:
            "If you have any questions about your subscription, feel free to reach out.",
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

            <Section style={detailsBox}>
              <Heading as="h3" style={detailsTitle}>
                {content.details}
              </Heading>
              <Text style={detailLine}>
                <strong>{content.planLabel}</strong> {tierDisplayName}
              </Text>
              <Text style={detailLine}>
                <strong>{content.amountLabel}</strong> {formattedAmount}
              </Text>
            </Section>

            <Text style={paragraph}>{content.whatNext}</Text>

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
                ? "Gerez votre abonnement depuis votre tableau de bord."
                : "Manage your subscription from your dashboard."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionConfirmationEmail;

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

const detailsBox = {
  backgroundColor: "#f0fdf4",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #bbf7d0",
  margin: "24px 0",
};

const detailsTitle = {
  color: "#166534",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const detailLine = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 6px",
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
