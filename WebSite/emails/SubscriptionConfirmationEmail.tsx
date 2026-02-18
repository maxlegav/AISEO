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
  const baseUrl =
    process.env.NEXTAUTH_URL || "https://showyourbrand.vercel.app";

  const formattedAmount = new Intl.NumberFormat(
    language === "fr" ? "fr-FR" : "en-US",
    { style: "currency", currency: currency.toUpperCase() },
  ).format(amount / 100);

  const tierDisplayName =
    {
      basic:
        language === "fr" ? "Basic (Audit Unique)" : "Basic (One-Time Audit)",
      pro: language === "fr" ? "Pro (Audit Unique)" : "Pro (One-Time Audit)",
      premium: "Premium",
    }[tier.toLowerCase()] || tier;

  const isOneShot =
    tier.toLowerCase() === "basic" || tier.toLowerCase() === "pro";

  const content =
    language === "fr"
      ? {
          preview: isOneShot
            ? "Confirmation de votre achat ShowYourBrand"
            : "Confirmation de votre abonnement ShowYourBrand",
          title: isOneShot ? "Achat confirmé !" : "Abonnement activé !",
          greeting: `Bonjour ${name},`,
          intro: isOneShot
            ? "Merci pour votre achat. Votre audit GEO est maintenant disponible."
            : `Merci pour votre abonnement. Votre plan ${tierDisplayName} est maintenant actif.`,
          details: "Détails de votre achat",
          planLabel: "Plan :",
          amountLabel: isOneShot ? "Montant :" : "Montant mensuel :",
          whatNext: isOneShot
            ? "Vous disposez maintenant d'un crédit d'audit. Lancez votre premier audit GEO dès maintenant !"
            : "Vous pouvez maintenant profiter de toutes les fonctionnalités de votre plan.",
          ctaText: "Accéder au tableau de bord",
          support:
            "Des questions sur votre abonnement ? Répondez à cet email.",
          signature: "L'équipe ShowYourBrand",
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
          details: "Purchase details",
          planLabel: "Plan:",
          amountLabel: isOneShot ? "Amount:" : "Monthly amount:",
          whatNext: isOneShot
            ? "You now have 1 audit credit. Start your first GEO audit now!"
            : "You can now enjoy all the features of your plan.",
          ctaText: "Go to Dashboard",
          support:
            "Questions about your subscription? Just reply to this email.",
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

            {/* Details box */}
            <Section style={detailsBox}>
              <Text style={detailsTitle}>{content.details}</Text>
              <Text style={detailLine}>
                <span style={detailLabel}>{content.planLabel}</span>{" "}
                {tierDisplayName}
              </Text>
              <Text style={detailLine}>
                <span style={detailLabel}>{content.amountLabel}</span>{" "}
                <span style={detailAmount}>{formattedAmount}</span>
              </Text>
            </Section>

            <Text style={paragraph}>{content.whatNext}</Text>

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
                ? "Gérez votre abonnement depuis votre tableau de bord."
                : "Manage your subscription from your dashboard."}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default SubscriptionConfirmationEmail;

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

const detailsBox = {
  background: "linear-gradient(135deg, #faf5ff 0%, #fdf2f8 50%, #fff7ed 100%)",
  padding: "20px 24px",
  borderRadius: "12px",
  border: "1px solid #e9d5ff",
  margin: "0 0 24px",
};

const detailsTitle = {
  color: "#7c3aed",
  fontSize: "11px",
  fontWeight: "700" as const,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0 0 14px",
};

const detailLine = {
  color: "#374151",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 6px",
};

const detailLabel = {
  color: "#6b7280",
  fontWeight: "400" as const,
};

const detailAmount = {
  color: "#1E293B",
  fontWeight: "700" as const,
  fontSize: "17px",
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
