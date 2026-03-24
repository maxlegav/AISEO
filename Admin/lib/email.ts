/**
 * Admin email service — uses Resend directly.
 * Plain HTML emails (no React Email dependency in Admin).
 */
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL ?? "noreply@showyourbrand.com";

export interface EmailResult {
  success: boolean;
  id?: string;
  error?: string;
}

async function sendEmail(params: {
  to: string;
  subject: string;
  html: string;
}): Promise<EmailResult> {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[Email] RESEND_API_KEY not set — skipping");
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: [params.to],
      subject: params.subject,
      html: params.html,
    });
    if (error) {
      console.error("[Email] Resend error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, id: data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[Email] Exception:", msg);
    return { success: false, error: msg };
  }
}

// ─── Client: audit completed ──────────────────────────────────────────────────

export async function sendAuditCompletedClientEmail(params: {
  to: string;
  userName: string;
  businessName: string;
  geoScore: number;
  auditUrl: string;
  language?: "en" | "fr";
}): Promise<EmailResult> {
  const { to, userName, businessName, geoScore, auditUrl, language = "fr" } = params;

  const scoreColor =
    geoScore >= 70 ? "#10B981" : geoScore >= 40 ? "#F59E0B" : "#EF4444";
  const scoreLabel =
    geoScore >= 70
      ? language === "fr" ? "Bonne visibilité" : "Good visibility"
      : geoScore >= 40
      ? language === "fr" ? "Visibilité modérée" : "Moderate visibility"
      : language === "fr" ? "Visibilité critique" : "Critical visibility";

  const subject =
    language === "fr"
      ? `Votre audit GEO pour ${businessName} est prêt`
      : `Your GEO audit for ${businessName} is ready`;

  const html =
    language === "fr"
      ? buildClientEmailFr({ userName, businessName, geoScore, scoreColor, scoreLabel, auditUrl })
      : buildClientEmailEn({ userName, businessName, geoScore, scoreColor, scoreLabel, auditUrl });

  return sendEmail({ to, subject, html });
}

// ─── HTML builders ────────────────────────────────────────────────────────────

interface EmailData {
  userName: string;
  businessName: string;
  geoScore: number;
  scoreColor: string;
  scoreLabel: string;
  auditUrl: string;
}

function buildClientEmailFr(d: EmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

    <!-- Header -->
    <div style="background:linear-gradient(135deg,#ddd6fe 0%,#fce7f3 55%,#fed7aa 100%);padding:36px 32px 28px;text-align:center">
      <p style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 4px">ShowYourBrand</p>
      <p style="color:#7c3aed;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0">Generative Engine Optimization</p>
    </div>

    <!-- Body -->
    <div style="padding:32px 36px">
      <h1 style="color:#1E293B;font-size:26px;font-weight:700;margin:0 0 16px">Votre rapport GEO est prêt&nbsp;!</h1>
      <p style="color:#374151;font-size:15px;font-weight:600;margin:0 0 12px">Bonjour ${d.userName},</p>
      <p style="color:#4b5563;font-size:14px;line-height:22px;margin:0 0 20px">
        Nous avons terminé l'audit de visibilité IA pour <strong>${d.businessName}</strong>. Vos résultats sont maintenant disponibles dans votre tableau de bord.
      </p>

      <!-- Score card -->
      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px">Votre GEO Health Score</p>
        <p style="font-size:48px;font-weight:800;color:${d.scoreColor};line-height:1;margin:0 0 8px">${d.geoScore}<span style="font-size:24px">/100</span></p>
        <span style="display:inline-block;font-size:12px;font-weight:600;color:${d.scoreColor};border:1px solid ${d.scoreColor};border-radius:20px;padding:3px 12px">${d.scoreLabel}</span>
      </div>

      <!-- Features -->
      <p style="color:#1E293B;font-size:15px;font-weight:600;margin:0 0 12px">Ce que vous trouverez dans votre rapport :</p>
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:16px 20px;margin:0 0 24px">
        ${[
          "Plan d'action priorisé avec les corrections les plus impactantes",
          "Analyse sur 4 moteurs IA (ChatGPT, Claude, Perplexity, DeepSeek)",
          "Snippets prêts à déployer (llms.txt, schema FAQ, HTML GEO)",
          "Comparaison avec vos concurrents",
        ].map((f, i) => `<p style="color:#374151;font-size:13px;line-height:26px;margin:0"><span style="color:#7c3aed;font-weight:700;margin-right:8px">${String(i+1).padStart(2,'0')}</span>${f}</p>`).join("")}
      </div>

      <!-- CTA -->
      <div style="text-align:center;margin:28px 0">
        <a href="${d.auditUrl}" style="display:inline-block;background:#7C3AED;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px">
          Voir mon rapport complet →
        </a>
      </div>

      <p style="color:#4b5563;font-size:14px;line-height:22px;margin:0 0 16px">Des questions ? Répondez directement à cet email.</p>
      <p style="color:#4b5563;font-size:14px;line-height:22px;margin:24px 0 28px">Cordialement,<br><strong>L'équipe ShowYourBrand</strong></p>
    </div>

    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0">
    <div style="padding:20px 36px;text-align:center;background:#fafafa;border-top:3px solid #ddd6fe">
      <p style="color:#1E293B;font-size:13px;font-weight:700;margin:0 0 4px">ShowYourBrand</p>
      <p style="color:#9ca3af;font-size:11px;margin:0">Rendez votre marque visible dans les moteurs de recherche IA</p>
    </div>
  </div>
</body>
</html>`;
}

function buildClientEmailEn(d: EmailData): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#f8f8f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.07)">

    <div style="background:linear-gradient(135deg,#ddd6fe 0%,#fce7f3 55%,#fed7aa 100%);padding:36px 32px 28px;text-align:center">
      <p style="color:#1E293B;font-size:22px;font-weight:700;margin:0 0 4px">ShowYourBrand</p>
      <p style="color:#7c3aed;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;margin:0">Generative Engine Optimization</p>
    </div>

    <div style="padding:32px 36px">
      <h1 style="color:#1E293B;font-size:26px;font-weight:700;margin:0 0 16px">Your GEO report is ready!</h1>
      <p style="color:#374151;font-size:15px;font-weight:600;margin:0 0 12px">Hello ${d.userName},</p>
      <p style="color:#4b5563;font-size:14px;line-height:22px;margin:0 0 20px">
        We've completed the AI visibility audit for <strong>${d.businessName}</strong>. Your results are now available in your dashboard.
      </p>

      <div style="background:#fafafa;border:1px solid #e5e7eb;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px">
        <p style="color:#6b7280;font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;margin:0 0 8px">Your GEO Health Score</p>
        <p style="font-size:48px;font-weight:800;color:${d.scoreColor};line-height:1;margin:0 0 8px">${d.geoScore}<span style="font-size:24px">/100</span></p>
        <span style="display:inline-block;font-size:12px;font-weight:600;color:${d.scoreColor};border:1px solid ${d.scoreColor};border-radius:20px;padding:3px 12px">${d.scoreLabel}</span>
      </div>

      <p style="color:#1E293B;font-size:15px;font-weight:600;margin:0 0 12px">What you'll find in your report:</p>
      <div style="background:#f5f3ff;border:1px solid #ddd6fe;border-radius:10px;padding:16px 20px;margin:0 0 24px">
        ${[
          "Prioritized action plan with the highest-impact fixes",
          "Visibility across 4 AI engines (ChatGPT, Claude, Perplexity, DeepSeek)",
          "Ready-to-deploy snippets (llms.txt, FAQ schema, GEO HTML)",
          "Competitor comparison",
        ].map((f, i) => `<p style="color:#374151;font-size:13px;line-height:26px;margin:0"><span style="color:#7c3aed;font-weight:700;margin-right:8px">${String(i+1).padStart(2,'0')}</span>${f}</p>`).join("")}
      </div>

      <div style="text-align:center;margin:28px 0">
        <a href="${d.auditUrl}" style="display:inline-block;background:#7C3AED;color:#fff;padding:14px 32px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px">
          View my full report →
        </a>
      </div>

      <p style="color:#4b5563;font-size:14px;line-height:22px;margin:0 0 16px">Questions? Just reply to this email.</p>
      <p style="color:#4b5563;font-size:14px;line-height:22px;margin:24px 0 28px">Best regards,<br><strong>The ShowYourBrand Team</strong></p>
    </div>

    <hr style="border:none;border-top:1px solid #f3f4f6;margin:0">
    <div style="padding:20px 36px;text-align:center;background:#fafafa;border-top:3px solid #ddd6fe">
      <p style="color:#1E293B;font-size:13px;font-weight:700;margin:0 0 4px">ShowYourBrand</p>
      <p style="color:#9ca3af;font-size:11px;margin:0">Make your brand visible in AI search engines</p>
    </div>
  </div>
</body>
</html>`;
}
