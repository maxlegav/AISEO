/**
 * Multi-tenant workspace resolution (SYB v2).
 *
 * Every user has a personal `Organization` (created on demand). Agencies invite
 * teammates into their organization via `Membership`; an invited teammate then
 * shares access to that organization's projects and clients.
 *
 * `resolveWorkspace(userId)` returns the organization the user is currently
 * acting in. To avoid a org-switcher UI in this first iteration, we pick, among
 * the user's active memberships, the organization with the most projects
 * (tie-break: the org the user owns). This means an invited teammate whose own
 * personal org is empty transparently lands in the agency workspace.
 *
 * Only call these from server code (getServerSideProps / API routes) — they
 * touch Mongo + models.
 */
import mongoose from "mongoose";
import Organization from "@/models/Organization";
import Membership from "@/models/Membership";
import Project from "@/models/Project";
import User from "@/models/User";
import { planForTier } from "@/lib/monitoring/plans";
import type { SubscriptionTier } from "@/lib/subscription-limits";
import type { MembershipRole } from "@/models/Membership";

async function connectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 1) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }
}

export interface Workspace {
  organizationId: string;
  organizationName: string;
  /** The organization owner (billing + white-label are read from this user). */
  ownerId: string;
  /** The acting user's role in this organization. */
  role: MembershipRole;
  isOwner: boolean;
}

/**
 * Ensure the user has a personal organization (owner) and an owner Membership,
 * then backfill any of their pre-multitenant projects onto it. Idempotent.
 */
export async function getOrCreatePersonalOrg(userId: string): Promise<string> {
  await connectDB();

  let org = await Organization.findOne({ ownerId: userId });
  if (!org) {
    const user = await User.findById(userId).select("name company email").lean<{
      name?: string;
      company?: string;
      email?: string;
    } | null>();
    const name =
      user?.company?.trim() ||
      (user?.name ? `${user.name.split(" ")[0]}'s workspace` : null) ||
      user?.email ||
      "Mon espace";
    org = await Organization.create({ name, ownerId: userId });
    await Membership.updateOne(
      { organizationId: org._id, email: (user?.email ?? "").toLowerCase() || `owner-${userId}` },
      {
        $set: {
          organizationId: org._id,
          userId,
          email: (user?.email ?? "").toLowerCase() || `owner-${userId}`,
          role: "owner",
          status: "active",
          acceptedAt: new Date(),
        },
      },
      { upsert: true },
    );
  }

  // Backfill legacy projects that predate organizationId.
  await Project.updateMany(
    { userId, $or: [{ organizationId: { $exists: false } }, { organizationId: null }] },
    { $set: { organizationId: org._id } },
  );

  return org._id.toString();
}

/**
 * Resolve the organization the user is acting in. Guarantees a personal org
 * exists, then prefers the active-membership org with the most projects.
 */
export async function resolveWorkspace(userId: string): Promise<Workspace> {
  await connectDB();
  const personalOrgId = await getOrCreatePersonalOrg(userId);

  const memberships = await Membership.find({ userId, status: "active" }).lean<
    { organizationId: mongoose.Types.ObjectId; role: MembershipRole }[]
  >();

  // Rank candidate orgs by project count; tie-break to the owned personal org.
  let best: { organizationId: string; role: MembershipRole; count: number } | null = null;
  for (const m of memberships) {
    const orgId = m.organizationId.toString();
    const count = await Project.countDocuments({ organizationId: m.organizationId });
    const isPersonal = orgId === personalOrgId;
    if (
      !best ||
      count > best.count ||
      (count === best.count && isPersonal)
    ) {
      best = { organizationId: orgId, role: m.role, count };
    }
  }

  const chosenId = best?.organizationId ?? personalOrgId;
  const org = await Organization.findById(chosenId).lean<{
    _id: mongoose.Types.ObjectId;
    name: string;
    ownerId: mongoose.Types.ObjectId;
  } | null>();

  const ownerId = org?.ownerId?.toString() ?? userId;
  const role: MembershipRole = best?.role ?? "owner";
  return {
    organizationId: chosenId,
    organizationName: org?.name ?? "Mon espace",
    ownerId,
    role,
    isOwner: ownerId === userId,
  };
}

export interface WorkspacePlan {
  tier: SubscriptionTier;
  whiteLabelActive: boolean;
}

/** Plan + white-label capability of a workspace, read from the org owner. */
export async function getWorkspacePlan(ownerId: string): Promise<WorkspacePlan> {
  await connectDB();
  const owner = await User.findById(ownerId).select("subscriptionTier").lean<{
    subscriptionTier?: SubscriptionTier;
  } | null>();
  const tier = (owner?.subscriptionTier as SubscriptionTier) || "none";
  return { tier, whiteLabelActive: planForTier(tier).brandedPdf };
}
