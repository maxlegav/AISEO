/**
 * Email normalisation for authentication lookups.
 *
 * Email local-parts are technically case-sensitive, but no real provider treats
 * them that way — and users do not remember which case they typed at signup.
 * The `User.email` schema path has no `lowercase` setter, so historically an
 * account created as `Max@Example.com` could not be found by
 * `User.findOne({ email: "max@example.com" })`: sign-in failed with
 * `USER_NOT_FOUND` and password reset silently did nothing (it already
 * lower-cased the lookup while signup stored the raw input).
 *
 * Everything that resolves a user *by email* must go through here:
 *  - writes are normalised (`normalizeEmail`), so new accounts are canonical;
 *  - reads (`findUserByEmail`) try the canonical form first — an index hit —
 *    then fall back to a case-insensitive match so accounts created before this
 *    normalisation existed keep working without a data migration.
 */
import User, { type UserDocument } from "@/models/User";
import type { FilterQuery } from "mongoose";

/** Canonical storage form of an email address. */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Find a user by email, tolerating legacy mixed-case records.
 * `extraFilter` is merged into both queries (e.g. `{ deletedAt: null }`).
 */
export async function findUserByEmail(
  email: string,
  extraFilter: FilterQuery<UserDocument> = {},
): Promise<UserDocument | null> {
  const normalized = normalizeEmail(email);

  const exact = await User.findOne({ email: normalized, ...extraFilter });
  if (exact) return exact;

  // Legacy accounts stored with the casing the user originally typed.
  return User.findOne({
    email: new RegExp(`^${escapeRegExp(normalized)}$`, "i"),
    ...extraFilter,
  });
}
