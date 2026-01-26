import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface InvoiceEmailProps {
  clientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  amount: string;
  currency: string;
  customMessage?: string;
  companyName: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyLogo?: string;
}

export const InvoiceEmail = ({
  clientName = "Client",
  invoiceNumber = "FAC-001",
  invoiceDate = "01/01/2024",
  dueDate = "15/01/2024",
  amount = "1000.00",
  currency = "EUR",
  customMessage = "",
  companyName = "Votre Entreprise",
  companyEmail = "contact@autoinvoice.pro",
  companyPhone = "",
  companyAddress = "",
  companyLogo = "",
}: InvoiceEmailProps) => {
  const previewText = `Facture ${invoiceNumber} - ${amount} ${currency}`;

  const defaultMessage = `Bonjour ${clientName},

Nous espérons que vous allez bien.

Veuillez trouver ci-joint votre facture n°${invoiceNumber} d'un montant de ${amount} ${currency}.

Date d'émission : ${invoiceDate}
Date d'échéance : ${dueDate}

Nous vous remercions de procéder au règlement avant la date d'échéance.

Pour toute question concernant cette facture, n'hésitez pas à nous contacter.

Cordialement,
L'équipe ${companyName}`;

  const finalMessage = customMessage || defaultMessage;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* En-tête avec logo */}
          <Section style={header}>
            {companyLogo && (
              <Img
                src={companyLogo}
                width="150"
                height="auto"
                alt={companyName}
                style={logo}
              />
            )}
            <Heading style={h1}>Nouvelle facture</Heading>
          </Section>

          {/* Contenu principal */}
          <Section style={content}>
            <Text style={paragraph}>
              {finalMessage.split("\n").map((line, index) => (
                <React.Fragment key={index}>
                  {line}
                  {index < finalMessage.split("\n").length - 1 && <br />}
                </React.Fragment>
              ))}
            </Text>

            {/* Informations de la facture */}
            <Section style={invoiceInfo}>
              <Text style={invoiceTitle}>Détails de la facture</Text>
              <Text style={invoiceDetail}>
                <strong>Numéro :</strong> {invoiceNumber}
              </Text>
              <Text style={invoiceDetail}>
                <strong>Date d'émission :</strong> {invoiceDate}
              </Text>
              <Text style={invoiceDetail}>
                <strong>Date d'échéance :</strong> {dueDate}
              </Text>
              <Text style={invoiceDetail}>
                <strong>Montant :</strong> {amount} {currency}
              </Text>
            </Section>
          </Section>

          {/* Pied de page */}
          <Section style={footer}>
            <Text style={footerText}>
              <strong>{companyName}</strong>
            </Text>
            {companyAddress && <Text style={footerText}>{companyAddress}</Text>}
            {companyEmail && (
              <Text style={footerText}>
                Email :{" "}
                <Link href={`mailto:${companyEmail}`} style={link}>
                  {companyEmail}
                </Link>
              </Text>
            )}
            {companyPhone && (
              <Text style={footerText}>Téléphone : {companyPhone}</Text>
            )}
          </Section>

          <Section style={disclaimer}>
            <Text style={disclaimerText}>
              Cet email a été envoyé automatiquement par AutoInvoice. Si vous
              avez des questions, contactez-nous à l'adresse ci-dessus.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default InvoiceEmail;

// Styles
const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  maxWidth: "600px",
};

const header = {
  padding: "32px 24px",
  textAlign: "center" as const,
  borderBottom: "1px solid #f0f0f0",
};

const logo = {
  margin: "0 auto 16px",
};

const h1 = {
  color: "#0f0f0f",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "1.25",
  margin: "0",
};

const content = {
  padding: "24px",
};

const paragraph = {
  color: "#525252",
  fontSize: "16px",
  lineHeight: "1.6",
  textAlign: "left" as const,
  whiteSpace: "pre-line" as const,
};

const invoiceInfo = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #e9ecef",
};

const invoiceTitle = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#0f0f0f",
  margin: "0 0 16px 0",
};

const invoiceDetail = {
  fontSize: "14px",
  color: "#525252",
  margin: "8px 0",
  lineHeight: "1.4",
};

const footer = {
  padding: "24px",
  borderTop: "1px solid #f0f0f0",
  textAlign: "center" as const,
  backgroundColor: "#f8f9fa",
};

const footerText = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "4px 0",
};

const link = {
  color: "#0066cc",
  textDecoration: "none",
};

const disclaimer = {
  padding: "16px 24px",
  textAlign: "center" as const,
};

const disclaimerText = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "1.4",
  margin: "0",
};
