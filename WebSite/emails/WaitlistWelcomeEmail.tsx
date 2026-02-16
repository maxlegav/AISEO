import * as React from 'react';
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
} from '@react-email/components';

interface WaitlistWelcomeEmailProps {
  email: string;
}

const WaitlistWelcomeEmail: React.FC<WaitlistWelcomeEmailProps> = ({
  email,
}) => {
  return (
    <Html>
      <Head />
      <Preview>You&apos;re on the ShowYourBrand waitlist!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <div style={logoContainer}>
              <span style={logoText}>SYB</span>
            </div>
            <Heading style={headerTitle}>You&apos;re on the list!</Heading>
          </Section>

          <Hr style={divider} />

          <Section style={contentSection}>
            <Text style={greeting}>Hey there,</Text>
            <Text style={paragraph}>
              Thanks for joining the ShowYourBrand waitlist! We&apos;re building the first
              Generative Engine Optimization (GEO) platform to help brands become visible
              in AI search engines like ChatGPT, Claude, Perplexity, and more.
            </Text>

            <Text style={paragraph}>
              You&apos;re among the first to sign up, and we&apos;ll make sure you&apos;re the first to know
              when we launch. Early waitlist members will get exclusive access and special pricing.
            </Text>

            <Section style={highlightBox}>
              <Text style={highlightText}>
                What to expect next:
              </Text>
              <Text style={featureItem}>1. Early access invitation before public launch</Text>
              <Text style={featureItem}>2. Exclusive founding member pricing</Text>
              <Text style={featureItem}>3. Priority onboarding and support</Text>
            </Section>

            <Text style={paragraph}>
              In the meantime, feel free to reply to this email if you have any questions.
              We read every message.
            </Text>

            <Text style={signature}>
              See you soon,
              <br />
              <strong>The ShowYourBrand Team</strong>
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={footer}>
            <Text style={footerText}>ShowYourBrand.ai - GEO Audit Platform</Text>
            <Text style={footerText}>
              Make your brand visible in AI search engines
            </Text>
            <Text style={footerTextSmall}>
              You received this email because {email} joined our waitlist.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WaitlistWelcomeEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,segoe ui,roboto,oxygen,ubuntu,cantarell,open sans,helvetica neue,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  maxWidth: '600px',
};

const header = {
  padding: '32px 32px 24px',
  textAlign: 'center' as const,
};

const logoContainer = {
  width: '48px',
  height: '48px',
  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
  borderRadius: '12px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: '16px',
};

const logoText = {
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: '700' as const,
};

const headerTitle = {
  color: '#1E293B',
  fontSize: '24px',
  fontWeight: '600',
  lineHeight: '32px',
  margin: '0',
};

const divider = {
  borderColor: '#e1e8ed',
  margin: '24px 0',
};

const contentSection = {
  padding: '0 32px',
};

const greeting = {
  color: '#1E293B',
  fontSize: '16px',
  fontWeight: '600',
  lineHeight: '24px',
  margin: '0 0 16px',
};

const paragraph = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
};

const highlightBox = {
  backgroundColor: '#fff7ed',
  padding: '16px 20px',
  borderRadius: '8px',
  border: '1px solid #fed7aa',
  margin: '0 0 24px',
};

const highlightText = {
  color: '#9a3412',
  fontSize: '14px',
  fontWeight: '600' as const,
  lineHeight: '24px',
  margin: '0 0 8px',
};

const featureItem = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '24px',
  margin: '0 0 4px',
};

const signature = {
  color: '#374151',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '24px 0 0',
};

const footer = {
  padding: '0 32px',
  textAlign: 'center' as const,
};

const footerText = {
  color: '#6b7280',
  fontSize: '12px',
  lineHeight: '16px',
  margin: '0 0 4px',
};

const footerTextSmall = {
  color: '#9ca3af',
  fontSize: '11px',
  lineHeight: '16px',
  margin: '8px 0 0',
};
