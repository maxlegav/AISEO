import * as React from "react";
import {
  Html, Head, Body, Container, Section, Text, Heading, Hr, Preview, Button,
} from "@react-email/components";

interface AuditNotificationAdminEmailProps {
  businessName: string;
  businessUrl: string;
  category: string;
  userName: string;
  userEmail: string;
  auditId: string;
  adminUrl: string;
}

const AuditNotificationAdminEmail: React.FC<AuditNotificationAdminEmailProps> = ({
  businessName,
  businessUrl,
  category,
  userName,
  userEmail,
  auditId: _auditId,
  adminUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>New audit to validate — {businessName}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerBanner}>
            <Text style={brandName}>ShowYourBrand</Text>
            <Text style={brandTagline}>Admin Notification</Text>
          </Section>

          <Section style={contentSection}>
            <Heading style={contentTitle}>New audit ready to validate</Heading>
            <Text style={paragraph}>
              A client has just launched a GEO audit. The prompts have been generated
              and are waiting for your approval before Phase 2 (AI execution) begins.
            </Text>

            <Section style={infoBox}>
              <Text style={infoRow}><strong>Business:</strong> {businessName}</Text>
              <Text style={infoRow}><strong>URL:</strong> {businessUrl}</Text>
              <Text style={infoRow}><strong>Category:</strong> {category}</Text>
              <Text style={infoRow}><strong>Client:</strong> {userName} ({userEmail})</Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={adminUrl} style={ctaButton}>
                Review &amp; Validate Prompts →
              </Button>
            </Section>

            <Text style={small}>
              Once you approve the prompts, Phase 2 (AI queries across 4 engines) will start automatically.
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>ShowYourBrand — Admin notification</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AuditNotificationAdminEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f8f8f8",
  fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "32px auto",
  borderRadius: "16px",
  overflow: "hidden" as const,
  maxWidth: "580px",
  boxShadow: "0 4px 24px rgba(0,0,0,0.07)",
};

const headerBanner = {
  background: "linear-gradient(135deg, #1E293B 0%, #334155 100%)",
  padding: "28px 32px 20px",
  textAlign: "center" as const,
};

const brandName = {
  color: "#ffffff",
  fontSize: "20px",
  fontWeight: "700",
  lineHeight: "26px",
  margin: "0 0 4px",
};

const brandTagline = {
  color: "#94a3b8",
  fontSize: "11px",
  fontWeight: "600",
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  margin: "0",
};

const contentSection = { padding: "32px 36px 8px" };

const contentTitle = {
  color: "#1E293B",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 16px",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
};

const infoBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "16px 20px",
  margin: "0 0 24px",
};

const infoRow = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "24px",
  margin: "0",
};

const ctaSection = { textAlign: "center" as const, margin: "28px 0" };

const ctaButton = {
  backgroundColor: "#7C3AED",
  color: "#ffffff",
  padding: "14px 32px",
  borderRadius: "50px",
  textDecoration: "none",
  fontWeight: "600",
  fontSize: "14px",
  display: "inline-block",
};

const small = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  margin: "0 0 28px",
};

const divider = { borderColor: "#f3f4f6", margin: "0" };

const footer = {
  padding: "16px 36px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
};

const footerText = {
  color: "#9ca3af",
  fontSize: "11px",
  margin: "0",
};
