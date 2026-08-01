import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * `findUserByEmail` is the fix for the sign-in bug where an account created as
 * `Max@Example.com` could not be found by `max@example.com` (signup stored the
 * raw input, the credentials provider queried it verbatim). We assert the two
 * behaviours that matter: writes/lookups are canonicalised, and a legacy
 * mixed-case record is still reachable via the case-insensitive fallback.
 */

const findOne = vi.fn();
vi.mock("@/models/User", () => ({
  default: { findOne: (...args: unknown[]) => findOne(...args) },
}));

const { normalizeEmail, findUserByEmail } = await import("@/lib/auth-email");

describe("normalizeEmail", () => {
  it("lower-cases and trims", () => {
    expect(normalizeEmail("  ShowYourBand@SYB.com ")).toBe(
      "showyourband@syb.com",
    );
  });
});

describe("findUserByEmail", () => {
  beforeEach(() => findOne.mockReset());

  it("finds a canonical account with an exact (indexed) query", async () => {
    const user = { email: "showyourband@syb.com" };
    findOne.mockResolvedValueOnce(user);

    await expect(findUserByEmail("ShowYourBand@syb.com")).resolves.toBe(user);
    expect(findOne).toHaveBeenCalledTimes(1);
    expect(findOne).toHaveBeenCalledWith({ email: "showyourband@syb.com" });
  });

  it("falls back to a case-insensitive match for legacy records", async () => {
    const legacy = { email: "Max@Example.com" };
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(legacy);

    await expect(findUserByEmail("max@example.com")).resolves.toBe(legacy);
    expect(findOne).toHaveBeenCalledTimes(2);

    const fallback = findOne.mock.calls[1]?.[0] as { email: RegExp };
    expect(fallback.email.test("Max@Example.com")).toBe(true);
    expect(fallback.email.test("max@example.comx")).toBe(false);
  });

  it("escapes regex metacharacters so an address cannot widen the match", async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await findUserByEmail("a.b+c@example.com");

    const fallback = findOne.mock.calls[1]?.[0] as { email: RegExp };
    expect(fallback.email.test("a.b+c@example.com")).toBe(true);
    expect(fallback.email.test("axbxc@examplexcom")).toBe(false);
  });

  it("merges an extra filter into both queries", async () => {
    findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    await findUserByEmail("max@example.com", { deletedAt: null });

    expect(findOne.mock.calls[0]?.[0]).toMatchObject({ deletedAt: null });
    expect(findOne.mock.calls[1]?.[0]).toMatchObject({ deletedAt: null });
  });
});
