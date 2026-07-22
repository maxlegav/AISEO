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

interface AuditStartedAdminEmailProps {
  userName: string;
  userEmail: string;
  businessName: string;
  businessUrl: string;
  category: string;
  auditId: string;
  subscriptionTier: string;
  adminUrl: string;
}

const AuditStartedAdminEmail: React.FC<AuditStartedAdminEmailProps> = ({
  userName,
  userEmail,
  businessName,
  businessUrl,
  category,
  auditId,
  subscriptionTier,
  adminUrl,
}) => {
  return (
    <Html>
      <Head />
      <Preview>🚀 New audit launched: {businessName} ({userEmail})</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={headerBanner}>
            <Text style={brandName}>ShowYourBrand</Text>
            <Text style={brandTagline}>⚡ Admin · Audit Launched</Text>
          </Section>

          {/* Content */}
          <Section style={contentSection}>
            <Heading style={contentTitle}>New audit has been launched</Heading>
            <Text style={paragraph}>
              A client just started a GEO audit. Prompt generation is now in progress.
              You&apos;ll receive another notification once the prompts are ready for your review.
            </Text>

            {/* Client info */}
            <Text style={sectionLabel}>CLIENT</Text>
            <Section style={infoBox}>
              <Text style={infoRow}>
                <strong>Name:</strong> {userName}
              </Text>
              <Text style={infoRow}>
                <strong>Email:</strong> {userEmail}
              </Text>
              <Text style={infoRow}>
                <strong>Plan:</strong>{" "}
                <span style={tierBadge}>{subscriptionTier.toUpperCase()}</span>
              </Text>
            </Section>

            {/* Business info */}
            <Text style={sectionLabel}>BUSINESS BEING AUDITED</Text>
            <Section style={infoBox}>
              <Text style={infoRow}>
                <strong>Name:</strong> {businessName}
              </Text>
              <Text style={infoRow}>
                <strong>URL:</strong> {businessUrl}
              </Text>
              <Text style={infoRow}>
                <strong>Category:</strong> {category}
              </Text>
              <Text style={infoRow}>
                <strong>Audit ID:</strong>{" "}
                <span style={monoText}>{auditId}</span>
              </Text>
            </Section>

            {/* Checklist */}
            <Text style={sectionLabel}>WHAT TO CHECK</Text>
            <Section style={checkList}>
              <Text style={checkItem}>
                <span style={checkIcon}>→</span> Verify the business URL is reachable
              </Text>
              <Text style={checkItem}>
                <span style={checkIcon}>→</span> Check category makes sense for prompt generation
              </Text>
              <Text style={checkItem}>
                <span style={checkIcon}>→</span> Watch for prompt generation completion (next email)
              </Text>
              <Text style={checkItem}>
                <span style={checkIcon}>→</span> Review &amp; approve prompts before AI execution starts
              </Text>
            </Section>

            <Section style={ctaSection}>
              <Button href={adminUrl} style={ctaButton}>
                Go to Admin Panel →
              </Button>
            </Section>

            <Text style={small}>
              Audit ID: <span style={monoText}>{auditId}</span>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>
              ShowYourBrand · Internal notification · Do not forward
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default AuditStartedAdminEmail;

// ─── Styles ──────────────────────────────────────────────────────────────────

const main = {
  backgroundColor: "#f1f5f9",
  fontFamily:
    "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Oxygen,Ubuntu,Cantarell,'Helvetica Neue',sans-serif",
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
  background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
  padding: "28px 32px 20px",
  textAlign: "center" as const,
  borderBottom: "3px solid #7c3aed",
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

const contentSection = { padding: "28px 36px 8px" };

const contentTitle = {
  color: "#1E293B",
  fontSize: "22px",
  fontWeight: "700",
  margin: "0 0 12px",
};

const paragraph = {
  color: "#4b5563",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 20px",
};

const sectionLabel = {
  color: "#7c3aed",
  fontSize: "10px",
  fontWeight: "700",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  margin: "0 0 6px",
};

const infoBox = {
  backgroundColor: "#f8fafc",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "14px 20px",
  margin: "0 0 20px",
};

const infoRow = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "24px",
  margin: "0",
};

const tierBadge = {
  backgroundColor: "#7c3aed",
  color: "#ffffff",
  fontSize: "10px",
  fontWeight: "700",
  padding: "2px 8px",
  borderRadius: "20px",
};

const monoText = {
  fontFamily: "monospace",
  fontSize: "12px",
  color: "#6b7280",
  backgroundColor: "#f3f4f6",
  padding: "1px 6px",
  borderRadius: "4px",
};

const checkList = {
  backgroundColor: "#fff7ed",
  border: "1px solid #fed7aa",
  borderRadius: "10px",
  padding: "12px 20px",
  margin: "0 0 24px",
};

const checkItem = {
  color: "#374151",
  fontSize: "13px",
  lineHeight: "26px",
  margin: "0",
};

const checkIcon = {
  color: "#f97316",
  fontWeight: "700" as const,
  marginRight: "8px",
};

const ctaSection = { textAlign: "center" as const, margin: "24px 0" };

const ctaButton = {
  backgroundColor: "#1E293B",
  color: "#ffffff",
  padding: "13px 30px",
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
  textAlign: "center" as const,
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
