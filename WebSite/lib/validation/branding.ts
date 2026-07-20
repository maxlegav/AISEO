import { z } from "zod";

/** Hex color like #7c3aed or #fff. */
const hexColor = z
  .string()
  .regex(/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Couleur hexadécimale invalide");

export const UpdateBrandingSchema = z.object({
  agencyName: z.string().max(80).optional(),
  logoUrl: z.string().url().max(500).or(z.literal("")).optional(),
  primaryColor: hexColor.optional(),
  customDomain: z.string().max(200).optional(),
  brandedPdfEnabled: z.boolean().optional(),
});

export type UpdateBrandingInput = z.infer<typeof UpdateBrandingSchema>;
