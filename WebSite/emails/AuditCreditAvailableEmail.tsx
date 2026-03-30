import * as React from "react";
import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Preview, Button,
} from "@react-email/components";

interface Props {
  userName: string;
  language?: "en" | "fr";
}

const AuditCreditAvailableEmail: React.FC<Props> = ({
  userName,
  language = "fr",
}) => {
  const c = language === "fr"
    ? {
        preview: "Votre crédit d'audit mensuel est disponible",
        title: "Votre audit du mois est prêt à lancer",
        greeting: `Bonjour ${userName},`,
        body: "Votre abonnement Pro a été renouvelé — votre crédit d'audit mensuel est disponible. Profitez-en pour mesurer votre progression GEO ce mois-ci.",
        cta: "Lancer mon audit →",
        tip: "💡 Conseil : lancez votre audit en début de mois pour comparer facilement mois après mois.",
        footer: "Vous recevez cet email car vous êtes abonné au plan Pro ShowYourBrand.",
      }
    : {
        preview: "Your monthly audit credit is available",
        title: "Your monthly audit is ready to launch",
        greeting: `Hello ${userName},`,
        body: "Your Pro subscription has been renewed — your monthly audit credit is now available. Use it to track your GEO progress this month.",
        cta: "Launch my audit →",
        tip: "💡 Tip: launch your audit at the start of the month to easily compare month over month.",
        footer: "You're receiving this because you're subscribed to the ShowYourBrand Pro plan.",
      };

  const dashboardUrl = `${process.env.NEXTAUTH_URL || "https://showyourbrand.app"}/dashboard`;

  return (
    <Html>
      <Head />
      <Preview>{c.preview}</Preview>
      <Body style={{ backgroundColor: "#f8f9fa", fontFamily: "sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 560, margin: "40px auto", backgroundColor: "#ffffff", borderRadius: 16, overflow: "hidden", border: "1px solid #e5e7eb" }}>
          {/* Header */}
          <Section style={{ backgroundColor: "#7c3aed", padding: "32px 40px" }}>
            <Heading style={{ color: "#ffffff", margin: 0, fontSize: 22, fontWeight: 700 }}>
              ShowYourBrand
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ padding: "32px 40px" }}>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px" }}>
              {c.greeting}
            </Text>
            <Text style={{ color: "#374151", fontSize: 15, lineHeight: "24px" }}>
              {c.body}
            </Text>

            <div style={{ textAlign: "center", margin: "32px 0" }}>
              <Button
                href={dashboardUrl}
                style={{ backgroundColor: "#7c3aed", color: "#ffffff", padding: "14px 32px", borderRadius: 50, fontWeight: 700, fontSize: 14, textDecoration: "none", display: "inline-block" }}
              >
                {c.cta}
              </Button>
            </div>

            <Text style={{ backgroundColor: "#f5f3ff", borderRadius: 8, padding: "12px 16px", color: "#5b21b6", fontSize: 13, lineHeight: "20px" }}>
              {c.tip}
            </Text>
          </Section>

          <Hr style={{ borderColor: "#e5e7eb" }} />
          <Section style={{ padding: "16px 40px" }}>
            <Text style={{ color: "#9ca3af", fontSize: 12 }}>{c.footer}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AuditCreditAvailableEmail;
