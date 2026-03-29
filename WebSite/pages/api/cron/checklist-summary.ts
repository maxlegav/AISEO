/**
 * GET /api/cron/checklist-summary
 *
 * Runs daily. Finds Pro/Agency users whose audit completed ~15 days ago
 * and sends them a checklist progress summary email.
 *
 * Auth: Bearer token matching CRON_SECRET env var.
 */
import type { NextApiRequest, NextApiResponse } from 'next';
import mongoose from 'mongoose';
import Audit from '@/models/Audit';
import User from '@/models/User';
import { sendChecklistSummaryEmail } from '@/lib/email';
import config from '@/config';

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) return;
  await mongoose.connect(process.env.MONGODB_URI!);
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'METHOD_NOT_ALLOWED' });
  }

  // Auth check
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return res.status(500).json({ success: false, error: 'CRON_SECRET not configured' });
  }
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.replace('Bearer ', '');
  if (token !== cronSecret) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  try {
    await connectDB();

    // Find completed Pro/Agency audits that completed ~15 days ago (13–17 day window)
    // and haven't had the summary email sent yet
    const now = new Date();
    const thirteenDaysAgo = new Date(now.getTime() - 13 * 24 * 60 * 60 * 1000);
    const seventeenDaysAgo = new Date(now.getTime() - 17 * 24 * 60 * 60 * 1000);

    const audits = await Audit.find({
      status: 'completed',
      completedAt: { $gte: seventeenDaysAgo, $lte: thirteenDaysAgo },
      checklistSummaryEmailSentAt: null,
    })
      .select('_id userId businessId businessName geoScore completedAt issueChecklist results')
      .lean();

    if (audits.length === 0) {
      return res.status(200).json({ success: true, processed: 0 });
    }

    // Fetch users and filter to Pro/Agency only
    const userIds = [...new Set(audits.map((a) => a.userId.toString()))];
    const users = await User.find({
      _id: { $in: userIds },
      subscriptionTier: { $in: ['pro', 'agency'] },
      deletedAt: null,
    })
      .select('_id email name language subscriptionTier')
      .lean();

    const userMap = new Map(users.map((u) => [u._id.toString(), u]));

    let processed = 0;
    let failed = 0;

    for (const audit of audits) {
      const user = userMap.get(audit.userId.toString());
      if (!user) continue; // Not Pro/Agency, skip

      const results = audit.results as {
        issues?: { id: string; type: string; title: string; severity: string }[];
      } | null;
      const allIssues = results?.issues ?? [];

      // Build checklist status
      const checklist = audit.issueChecklist ?? [];
      const doneIds = new Set(
        checklist.filter((c) => c.done).map((c) => c.issueId)
      );

      const doneItems = allIssues
        .filter((i) => doneIds.has(i.id))
        .map((i) => ({ title: i.title, severity: i.severity as 'critical' | 'high' | 'medium' | 'low', done: true }));

      const pendingItems = allIssues
        .filter((i) => !doneIds.has(i.id))
        .map((i) => ({ title: i.title, severity: i.severity as 'critical' | 'high' | 'medium' | 'low', done: false }));

      // Best effort: we don't have the username here, link to dashboard
      const directUrl = `${config.siteUrl}/dashboard`;

      try {
        await sendChecklistSummaryEmail({
          email: user.email,
          userName: (user as { name: string }).name,
          businessName: audit.businessName ?? 'your business',
          geoScore: audit.geoScore ?? 0,
          doneItems,
          pendingItems,
          auditUrl: directUrl,
          language: ((user as { language?: string }).language as 'en' | 'fr') ?? 'fr',
        });

        // Mark as sent
        await Audit.findByIdAndUpdate(audit._id, {
          checklistSummaryEmailSentAt: new Date(),
        });
        processed++;
      } catch (err) {
        console.error(`[Cron/ChecklistSummary] Failed to send for audit ${audit._id}:`, err);
        failed++;
      }
    }

    return res.status(200).json({ success: true, processed, failed });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Cron/ChecklistSummary] Error:', msg);
    return res.status(500).json({ success: false, error: msg });
  }
}
