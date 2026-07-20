import { z } from "zod";

const llmEnum = z.enum(["chatgpt", "claude", "perplexity", "gemini"]);

export const CreateProjectSchema = z.object({
  brandName: z.string().min(1).max(120),
  websiteUrl: z.string().min(1).max(300),
  category: z.string().max(160).optional(),
  competitors: z.array(z.string().min(1).max(120)).max(10).default([]),
  prompts: z.array(z.string().min(1).max(500)).max(100).default([]),
  llms: z.array(llmEnum).min(1).default(["chatgpt", "claude", "perplexity", "gemini"]),
  frequency: z.enum(["weekly", "daily"]).default("weekly"),
});

export const UpdateProjectSchema = CreateProjectSchema.partial().extend({
  active: z.boolean().optional(),
});

export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;
