import { describe, it, expect } from "vitest";
import { requireManager, isManager } from "@/lib/workspace-roles";
import { ApiError, ErrorType } from "@/lib/error-handler";
import type { Workspace } from "@/lib/monitoring/workspace";
import type { MembershipRole } from "@/models/Membership";

function workspace(role: MembershipRole): Workspace {
  return {
    organizationId: "org1",
    organizationName: "Agence",
    ownerId: "owner1",
    role,
    isOwner: role === "owner",
  };
}

describe("requireManager: organization role enforcement", () => {
  it("allows owner and admin to manage the organization", () => {
    expect(() => requireManager(workspace("owner"))).not.toThrow();
    expect(() => requireManager(workspace("admin"))).not.toThrow();
    expect(isManager(workspace("owner"))).toBe(true);
    expect(isManager(workspace("admin"))).toBe(true);
  });

  it("blocks plain members from managing the organization", () => {
    expect(isManager(workspace("member"))).toBe(false);
    expect(() => requireManager(workspace("member"))).toThrow(ApiError);
    try {
      requireManager(workspace("member"));
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).type).toBe(ErrorType.AUTHORIZATION);
    }
  });
});
