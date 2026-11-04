/**
 * Data behind `/demo` — the public, unauthenticated dashboard linked from the
 * landing page (the same thing Promptmonitor does: let a prospect click through
 * a real dashboard before creating an account).
 *
 * Two sources, in order:
 *  1. The showcase account, when `DEMO_ACCOUNT_EMAIL` names one that exists and
 *     owns projects. Its projects are seeded by
 *     `scripts/seed-showcase-projects.js` and carry real pipeline output, which
 *     is what makes the demo convincing.
 *  2. The hand-written mock projects (`lib/mock/monitoring`) otherwise, so the
 *     route is never broken — including on a deployment where the showcase
 *     account was never seeded.
 *
 * Everything here is read-only: no session is resolved, nothing is written, and
 * the `/demo` pages expose no action that mutates a project.
 */
import mongoose from "mongoose";
import {
  getProjectDashboard,
  getProjectSummaries,
  listSwitcherProjects,
  type SwitcherEntry,
} from "@/lib/monitoring/dashboard";
import { resolveWorkspace } from "@/lib/monitoring/workspace";
import { findUserByEmail } from "@/lib/auth-email";
import { PROJECTS as MOCK_PROJECTS, type Project } from "@/lib/mock/monitoring";

/** Organization id of the showcase account, or null when there is none. */
async function showcaseOrgId(): Promise<string | null> {
  const email = process.env.DEMO_ACCOUNT_EMAIL;
  if (!email) return null;
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI!);
    }
    const user = await findUserByEmail(email);
    if (!user) return null;
    const workspace = await resolveWorkspace(user._id.toString());
    return workspace.organizationId;
  } catch {
    // A demo page must never 500 because the showcase account is misconfigured.
    return null;
  }
}

function mockSwitcher(): SwitcherEntry[] {
  return MOCK_PROJECTS.map((p) => ({
    id: p.id,
    brandName: p.brandName,
    websiteUrl: p.websiteUrl,
  }));
}

export interface PublicDemoList {
  projects: Project[];
  switcherProjects: SwitcherEntry[];
}

export async function getPublicDemoProjects(): Promise<PublicDemoList> {
  const orgId = await showcaseOrgId();
  if (orgId) {
    const { projects, demo } = await getProjectSummaries(orgId);
    if (!demo && projects.length > 0) {
      return { projects, switcherProjects: await listSwitcherProjects(orgId) };
    }
  }
  return { projects: MOCK_PROJECTS, switcherProjects: mockSwitcher() };
}

export interface PublicDemoProject {
  project: Project | null;
  switcherProjects: SwitcherEntry[];
}

export async function getPublicDemoProject(
  projectId: string,
): Promise<PublicDemoProject> {
  const orgId = await showcaseOrgId();
  if (orgId) {
    const { project, demo } = await getProjectDashboard(orgId, projectId);
    if (!demo && project) {
      return { project, switcherProjects: await listSwitcherProjects(orgId) };
    }
  }
  return {
    project: MOCK_PROJECTS.find((p) => p.id === projectId) ?? null,
    switcherProjects: mockSwitcher(),
  };
}

/** First project of the demo, used to land `/demo` on something concrete. */
export async function firstPublicDemoProjectId(): Promise<string | null> {
  const { projects } = await getPublicDemoProjects();
  return projects[0]?.id ?? null;
}
