import { ApiError, ErrorType } from "@/lib/error-handler";
import type { Workspace } from "@/lib/monitoring/workspace";

/** True when the workspace role can manage the organization (owner/admin). */
export function isManager(workspace: Pick<Workspace, "role">): boolean {
  return workspace.role === "owner" || workspace.role === "admin";
}

/** Throw AUTHORIZATION unless the workspace role is owner or admin. */
export function requireManager(workspace: Pick<Workspace, "role">): void {
  if (!isManager(workspace)) {
    throw new ApiError(
      ErrorType.AUTHORIZATION,
      "Seuls les administrateurs de l'organisation peuvent effectuer cette action.",
    );
  }
}
