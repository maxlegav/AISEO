import { Resend } from "resend";
import { render } from "@react-email/render";
import WelcomeEmail from "@/emails/WelcomeEmail";
import PasswordResetEmail from "@/emails/PasswordResetEmail";
import SubscriptionConfirmationEmail from "@/emails/SubscriptionConfirmationEmail";
import AuditStartedClientEmail from "@/emails/AuditStartedClientEmail";
import AuditStartedAdminEmail from "@/emails/AuditStartedAdminEmail";
import AuditNotificationAdminEmail from "@/emails/AuditNotificationAdminEmail";
import AuditCompletedClientEmail from "@/emails/AuditCompletedClientEmail";
import AuditCreditAvailableEmail from "@/emails/AuditCreditAvailableEmail";
import ChecklistSummaryEmail from "@/emails/ChecklistSummaryEmail";

// Lazily construct the Resend client. The Resend constructor throws when no
// API key is present, which would crash `next build` page-data collection in
// CI (where env vars are absent) as soon as any page imports this module.
// Callers already guard on RESEND_API_KEY before sending, so this is only
// reached at runtime when a key is configured.
let _resend: Resend | null = null;
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

// Email sender configuration
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "noreply@showyourbrand.app";

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

    const { data, error } = await getResend().emails.send({
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
 * Notify client that their audit has started.
 * Called right after the audit document is created.
 */
export async function sendAuditStartedClientEmail(params: {
  email: string;
  userName: string;
  businessName: string;
  businessUrl: string;
  language?: "en" | "fr";
}): Promise<EmailResult> {
  const { email, userName, businessName, businessUrl, language = "fr" } = params;

  const subject =
    language === "fr"
      ? `Votre audit GEO a démarré : ${businessName}`
      : `Your GEO audit has started: ${businessName}`;

  const html = await render(
    AuditStartedClientEmail({ userName, businessName, businessUrl, language })
  );

  return sendEmail({ to: email, subject, html });
}

/**
 * Notify admin internally that a new audit was just launched.
 * Called right after the audit document is created.
 */
export async function sendAuditStartedAdminEmail(params: {
  userName: string;
  userEmail: string;
  businessName: string;
  businessUrl: string;
  category: string;
  auditId: string;
  subscriptionTier: string;
  adminUrl: string;
}): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[Email] ADMIN_EMAIL not configured, skipping admin audit started notification");
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const html = await render(AuditStartedAdminEmail(params));

  return sendEmail({
    to: adminEmail,
    subject: `[SYB] 🚀 Audit launched: ${params.businessName} (${params.userEmail})`,
    html,
  });
}

/**
 * Notify admin that a new audit was launched and needs prompt validation.
 * Called right after the audit document is created in create.ts.
 */
export async function sendAuditLaunchedAdminEmail(params: {
  businessName: string;
  businessUrl: string;
  category: string;
  userName: string;
  userEmail: string;
  auditId: string;
  adminUrl: string;
}): Promise<EmailResult> {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn("[Email] ADMIN_EMAIL not configured, skipping admin audit notification");
    return { success: false, error: "ADMIN_EMAIL not configured" };
  }

  const html = await render(AuditNotificationAdminEmail(params));

  return sendEmail({
    to: adminEmail,
    subject: `[SYB] New audit to validate: ${params.businessName}`,
    html,
  });
}

/**
 * Notify client that their audit is completed and ready to view.
 * Called when admin marks the audit as completed.
 */
export async function sendAuditCompletedClientEmail(params: {
  email: string;
  userName: string;
  businessName: string;
  geoScore: number;
  auditUrl: string;
  language?: "en" | "fr";
}): Promise<EmailResult> {
  const { email, userName, businessName, geoScore, auditUrl, language = "fr" } = params;

  const subject =
    language === "fr"
      ? `Votre audit GEO pour ${businessName} est prêt`
      : `Your GEO audit for ${businessName} is ready`;

  const html = await render(
    AuditCompletedClientEmail({ userName, businessName, geoScore, auditUrl, language })
  );

  return sendEmail({ to: email, subject, html });
}

/**
 * Notify Pro user their monthly audit credit is available (subscription renewal).
 */
export async function sendAuditCreditAvailableEmail(params: {
  email: string;
  userName: string;
  language?: "en" | "fr";
}): Promise<EmailResult> {
  const { email, userName, language = "fr" } = params;
  const subject =
    language === "fr"
      ? "Votre crédit d'audit mensuel est disponible · ShowYourBrand"
      : "Your monthly audit credit is available · ShowYourBrand";
  const html = await render(AuditCreditAvailableEmail({ userName, language }));
  return sendEmail({ to: email, subject, html });
}

/**
 * Send 15-day checklist progress summary to Pro users.
 */
export async function sendChecklistSummaryEmail(params: {
  email: string;
  userName: string;
  businessName: string;
  geoScore: number;
  doneItems: { title: string; severity: "critical" | "high" | "medium" | "low"; done: boolean }[];
  pendingItems: { title: string; severity: "critical" | "high" | "medium" | "low"; done: boolean }[];
  auditUrl: string;
  language?: "en" | "fr";
}): Promise<EmailResult> {
  const { email, userName, businessName, geoScore, doneItems, pendingItems, auditUrl, language = "fr" } = params;
  const subject =
    language === "fr"
      ? `Bilan de vos actions GEO : ${businessName}`
      : `GEO action progress summary: ${businessName}`;
  const html = await render(
    ChecklistSummaryEmail({ userName, businessName, geoScore, doneItems, pendingItems, auditUrl, language })
  );
  return sendEmail({ to: email, subject, html });
}

/**
 * Send a passwordless magic-link sign-in email (NextAuth EmailProvider).
 */
export async function sendMagicLinkEmail(
  email: string,
  url: string,
  language: "en" | "fr" = "fr",
): Promise<EmailResult> {
  const subject =
    language === "fr"
      ? "Votre lien de connexion ShowYourBrand"
      : "Your ShowYourBrand sign-in link";

  const heading = language === "fr" ? "Connexion à ShowYourBrand" : "Sign in to ShowYourBrand";
  const body =
    language === "fr"
      ? "Cliquez sur le bouton ci-dessous pour vous connecter. Ce lien expire dans 15 minutes."
      : "Click the button below to sign in. This link expires in 15 minutes.";
  const cta = language === "fr" ? "Se connecter" : "Sign in";
  const ignore =
    language === "fr"
      ? "Si vous n'avez pas demandé ce lien, ignorez cet email."
      : "If you didn't request this link, you can safely ignore this email.";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color:#1E293B; font-size:20px;">${heading}</h1>
      <p style="color:#334155;">${body}</p>
      <p style="margin:24px 0;">
        <a href="${url}" style="background:#7c3aed; color:#fff; padding:12px 22px; border-radius:8px; text-decoration:none; font-weight:600;">${cta}</a>
      </p>
      <p style="color:#94a3b8; font-size:13px;">${ignore}</p>
    </div>`;

  return sendEmail({ to: email, subject, html });
}

/**
 * Notify a user that their GEO visibility moved significantly on one or more
 * engines during the latest monitoring run (SYB v2 weekly/daily alert).
 */
export async function sendMonitoringAlertEmail(params: {
  email: string;
  userName: string;
  brandName: string;
  projectUrl: string;
  globalScore: number;
  changes: { engine: string; delta: number }[];
  language?: "en" | "fr";
}): Promise<EmailResult> {
  const { email, userName, brandName, projectUrl, globalScore, changes, language = "fr" } = params;

  const rows = changes
    .map((c) => {
      const up = c.delta >= 0;
      const color = up ? "#16a34a" : "#dc2626";
      const sign = up ? "+" : "";
      return `<li style="margin:4px 0;"><strong>${c.engine}</strong> : <span style="color:${color};">${sign}${c.delta} pts</span></li>`;
    })
    .join("");

  const subject =
    language === "fr"
      ? `Alerte visibilité : ${brandName} (score ${globalScore}/100)`
      : `Visibility alert: ${brandName} (score ${globalScore}/100)`;

  const intro =
    language === "fr"
      ? `Bonjour ${userName}, la visibilité de <strong>${brandName}</strong> dans les IA a bougé cette période :`
      : `Hello ${userName}, the AI visibility of <strong>${brandName}</strong> changed this period:`;

  const cta = language === "fr" ? "Voir le tableau de bord" : "View the dashboard";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <h1 style="color:#1E293B; font-size:20px;">${subject}</h1>
      <p style="color:#334155;">${intro}</p>
      <ul style="color:#334155; padding-left:18px;">${rows}</ul>
      <p style="margin-top:24px;">
        <a href="${projectUrl}" style="background:#7c3aed; color:#fff; padding:10px 18px; border-radius:8px; text-decoration:none;">${cta}</a>
      </p>
    </div>`;

  return sendEmail({ to: email, subject, html });
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
