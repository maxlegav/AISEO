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

interface ReminderEmailProps {
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  currency: string;
  daysLate: number;
  reminderType: "first" | "final";
  companyName: string;
  companyEmail: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
}

const ReminderEmail: React.FC<ReminderEmailProps> = ({
  clientName,
  invoiceNumber,
  invoiceDate,
  dueDate,
  amount,
  currency,
  daysLate,
  reminderType,
  companyName,
  companyEmail,
  companyPhone,
  companyAddress,
  companyLogo,
}) => {
  const isFirstReminder = reminderType === "first";

  const previewText = isFirstReminder
    ? `Rappel de paiement pour la facture ${invoiceNumber}`
    : `Rappel final pour la facture ${invoiceNumber}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête avec logo si disponible */}
          <Section style={header}>
            {companyLogo && (
              <Img
                src={companyLogo}
                width="120"
                height="60"
                alt={`Logo ${companyName}`}
                style={logo}
              />
            )}
            <Heading style={headerTitle}>
              {isFirstReminder ? "Rappel de paiement" : "Rappel final"}
            </Heading>
            <Text style={headerSubtitle}>
              Facture {invoiceNumber} • {companyName}
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Corps du message */}
          <Section style={content}>
            <Text style={greeting}>Bonjour {clientName},</Text>

            {isFirstReminder ? (
              <>
                <Text style={paragraph}>
                  Nous espérons que vous allez bien.
                </Text>
                <Text style={paragraph}>
                  Nous vous écrivons concernant la facture{" "}
                  <strong>{invoiceNumber}</strong> d'un montant de{" "}
                  <strong>
                    {amount} {currency}
                  </strong>
                  , qui était due le <strong>{dueDate}</strong>.
                </Text>
                <Text style={paragraph}>
                  Cette facture accuse actuellement un retard de{" "}
                  <strong style={highlight}>
                    {daysLate} jour{daysLate > 1 ? "s" : ""}
                  </strong>
                  .
                </Text>
                <Text style={paragraph}>
                  Pourriez-vous s'il vous plaît procéder au règlement dans les
                  plus brefs délais ? Si le paiement a déjà été effectué,
                  veuillez nous en informer.
                </Text>
              </>
            ) : (
              <>
                <Text style={paragraph}>
                  Nous vous contactons une dernière fois concernant la facture{" "}
                  <strong>{invoiceNumber}</strong> d'un montant de{" "}
                  <strong>
                    {amount} {currency}
                  </strong>
                  .
                </Text>
                <Text style={paragraph}>
                  Cette facture, initialement due le <strong>{dueDate}</strong>,
                  accuse maintenant un retard de{" "}
                  <strong style={alertHighlight}>
                    {daysLate} jour{daysLate > 1 ? "s" : ""}
                  </strong>
                  .
                </Text>
                <Text style={alertParagraph}>
                  <strong>⚠️ Ceci constitue notre rappel final.</strong> Nous
                  vous demandons de bien vouloir procéder au règlement
                  immédiatement pour éviter d'éventuelles mesures de
                  recouvrement.
                </Text>
                <Text style={paragraph}>
                  Si vous rencontrez des difficultés de paiement, veuillez nous
                  contacter au plus vite pour trouver une solution.
                </Text>
              </>
            )}

            {/* Bloc détails facture */}
            <Section style={invoiceDetails}>
              <Heading as="h3" style={invoiceDetailsTitle}>
                📋 Détails de la facture
              </Heading>
              <Text style={detailLine}>
                • <strong>Numéro :</strong> {invoiceNumber}
              </Text>
              <Text style={detailLine}>
                • <strong>Date d'émission :</strong> {invoiceDate}
              </Text>
              <Text style={detailLine}>
                • <strong>Date d'échéance :</strong> {dueDate}
              </Text>
              <Text style={detailLine}>
                • <strong>Montant :</strong> {amount} {currency}
              </Text>
              <Text style={detailLine}>
                • <strong>Retard :</strong> {daysLate} jour
                {daysLate > 1 ? "s" : ""}
              </Text>
            </Section>

            <Text style={paragraph}>
              Vous trouverez la facture en pièce jointe de cet email.
            </Text>

            <Text style={paragraph}>
              En cas de questions, n'hésitez pas à nous contacter.
            </Text>

            <Text style={signature}>
              Cordialement,
              <br />
              <strong>{companyName}</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          {/* Pied de page */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>{companyName}</strong>
            </Text>
            <Text style={footerText}>📧 {companyEmail}</Text>
            {companyPhone && <Text style={footerText}>📞 {companyPhone}</Text>}
            {companyAddress && (
              <Text style={footerText}>📍 {companyAddress}</Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default ReminderEmail;

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
  borderBottom: "1px solid #e1e8ed",
};

const logo = {
  margin: "0 auto 16px",
  display: "block",
};

const headerTitle = {
  color: "#1a1a1a",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 8px",
};

const headerSubtitle = {
  color: "#6b7280",
  fontSize: "14px",
  margin: "0",
};

const divider = {
  borderColor: "#e1e8ed",
  margin: "24px 0",
};

const content = {
  padding: "0 32px",
};

const greeting = {
  color: "#1a1a1a",
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

const alertParagraph = {
  color: "#dc2626",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "16px 0",
  padding: "12px 16px",
  backgroundColor: "#fef2f2",
  border: "1px solid #fed7d7",
  borderRadius: "6px",
};

const highlight = {
  color: "#f59e0b",
  fontWeight: "600",
};

const alertHighlight = {
  color: "#dc2626",
  fontWeight: "600",
};

const invoiceDetails = {
  backgroundColor: "#f9fafb",
  padding: "20px",
  borderRadius: "8px",
  margin: "24px 0",
  border: "1px solid #e5e7eb",
};

const invoiceDetailsTitle = {
  color: "#374151",
  fontSize: "16px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const detailLine = {
  color: "#374151",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 6px",
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
