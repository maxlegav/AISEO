import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/WelcomeEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import SubscriptionConfirmationEmail from "@/emails/SubscriptionConfirmationEmail";

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@ShowYourBrand.com";

export interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

/**
 * Send an email using Resend.
 * This is the base function used by all email helpers.
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
}: SendEmailParams): Promise<EmailResult> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn(
        "[Email] RESEND_API_KEY not configured, skipping email send",
      );
      return { success: false, error: "Email service not configured" };
    }

    const { data, error } = await resend.emails.send({
      from: from || FROM_EMAIL,
      to: [to],
      subject,
      html,
    });

    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Email] Exception:", errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a welcome email to new users.
 * Called after successful registration.
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  language: "en" | "fr" = "en",
): Promise<EmailResult> {
  const subject =
    language === "fr"
      ? "Bienvenue sur ShowYourBrand - Votre plateforme GEO"
      : "Welcome to ShowYourBrand - Your GEO Platform";

  const html = await render(WelcomeEmail({ name, language }));

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send a password reset email with a secure token link.
 * Called when user requests password reset.
 */
export async function sendPasswordResetEmail(
  email: string,
  name: string,
  resetUrl: string,
  language: "en" | "fr" = "en",
): Promise<EmailResult> {
  const subject =
    language === "fr"
      ? "Réinitialisez votre mot de passe ShowYourBrand"
      : "Reset your ShowYourBrand password";

  const html = await render(PasswordResetEmail({ name, resetUrl, language }));

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send subscription confirmation email.
 * Called after successful Stripe payment.
 */
export async function sendSubscriptionConfirmationEmail(
  email: string,
  name: string,
  tier: string,
  amount: number,
  currency: string,
  language: "en" | "fr" = "en",
): Promise<EmailResult> {
  const subject =
    language === "fr"
      ? "Confirmation de votre abonnement ShowYourBrand"
      : "Your ShowYourBrand subscription is confirmed";

  const html = await render(
    SubscriptionConfirmationEmail({
      name,
      tier,
      amount,
      currency,
      language,
    }),
  );

  return sendEmail({
    to: email,
    subject,
    html,
  });
}

/**
 * Send account deletion confirmation email.
 * Called when user requests account deletion.
 */
export async function sendAccountDeletionEmail(
  email: string,
  name: string,
  language: "en" | "fr" = "en",
): Promise<EmailResult> {
  const subject =
    language === "fr"
      ? "Confirmation de suppression de compte ShowYourBrand"
      : "ShowYourBrand Account Deletion Confirmation";

  const html =
    language === "fr"
      ? `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1E293B;">Compte supprime</h1>
        <p>Bonjour ${name},</p>
        <p>Votre compte ShowYourBrand a ete programme pour suppression. Vos donnees seront supprimees dans les 30 prochains jours conformement a nos politiques RGPD.</p>
        <p>Si vous n'avez pas demande cette suppression, veuillez nous contacter immediatement.</p>
        <p>Cordialement,<br/>L'equipe ShowYourBrand</p>
      </div>
    `
      : `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #1E293B;">Account Deleted</h1>
        <p>Hello ${name},</p>
        <p>Your ShowYourBrand account has been scheduled for deletion. Your data will be permanently removed within 30 days in accordance with our GDPR policies.</p>
        <p>If you did not request this deletion, please contact us immediately.</p>
        <p>Best regards,<br/>The ShowYourBrand Team</p>
      </div>
    `;

  return sendEmail({
    to: email,
    subject,
    html,
  });
}
