/**
 * POST /api/webhook/audit-ready
 *
 * Called by the Python processing server when an audit Phase 2 completes
 * (status → review_pending). Sends an admin notification email to review results.
 *
 * Auth: Bearer token matching AUDIT_WEBHOOK_SECRET env var.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import User from '@/models/User';
import { sendEmail } from '@/lib/email';
import config from '@/config';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  // Verify webhook secret
  const webhookSecret = process.env.AUDIT_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Webhook] AUDIT_WEBHOOK_SECRET not configured');
    return res.status(500).json({ success: false, error: 'Webhook not configured' });
  }

  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (token !== webhookSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const { auditId } = req.body as { auditId?: string };
  if (!auditId || typeof auditId !== 'string') {
    return res.status(400).json({ success: false, error: 'Missing auditId' });
  }

  try {
    await connectDB();

    const audit = await Audit.findById(auditId)
      .select('businessName geoScore userId status')
      .lean();

    if (!audit) {
      return res.status(404).json({ success: false, error: 'Audit not found' });
    }

    // Notify admin to review
    const adminEmail = process.env.ADMIN_EMAIL;
    if (adminEmail) {
      const user = await User.findById(audit.userId).select('email name username').lean();
      const clientInfo = user
        ? `${(user as { name?: string }).name ?? ''} (${user.email})`
        : 'Unknown client';

      const adminUrl = `${config.siteUrl}/admin/audits`;

      await sendEmail({
        to: adminEmail,
        subject: `[SYB] Audit ready to review — ${audit.businessName ?? 'Unknown'} (Score: ${audit.geoScore ?? '?'}/100)`,
        html: `
          <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:20px">
            <h2 style="color:#1E293B">Audit ready for review</h2>
            <p>Phase 2 (AI execution) has completed successfully.</p>
            <table style="border-collapse:collapse;width:100%;margin:16px 0">
              <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px">Business</td><td style="font-size:13px;font-weight:600">${audit.businessName ?? '—'}</td></tr>
              <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px">GEO Score</td><td style="font-size:13px;font-weight:600">${audit.geoScore ?? '—'}/100</td></tr>
              <tr><td style="padding:6px 12px 6px 0;color:#6b7280;font-size:13px">Client</td><td style="font-size:13px">${clientInfo}</td></tr>
            </table>
            <a href="${adminUrl}" style="display:inline-block;background:#7C3AED;color:#fff;padding:12px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:14px;margin-top:8px">
              Review &amp; Complete →
            </a>
            <p style="color:#9ca3af;font-size:11px;margin-top:24px">ShowYourBrand Admin</p>
          </div>
        `,
      });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('[Webhook] audit-ready error:', err);
    return res.status(500).json({ success: false, error: 'Internal error' });
  }
}
