import { z } from "zod";

// ── Enums ─────────────────────────────────────────────────────────────────────

export const ContentTypeSchema = z.enum(["post", "video", "reel", "carousel"]);

export const ContentStatusSchema = z.enum([
  "planned",
  "in_progress",
  "review",
  "done",
  "published",
]);

export const PrioritySchema = z.enum(["low", "medium", "high"]);

export const PlatformSchema = z.enum([
  "LinkedIn",
  "X",
  "Instagram",
  "TikTok",
  "YouTube",
  "Facebook",
]);

// ── Reusable field types ──────────────────────────────────────────────────────

const idField = z.string().min(1, "Must be a non-empty string");

// Optional URL: accepts a valid URL or empty string (treated as absent)
const optionalUrl = z
  .string()
  .url("Must be a valid URL")
  .or(z.literal(""))
  .optional()
  .nullable();

// Date-only string YYYY-MM-DD
const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be a date in YYYY-MM-DD format");

// ── Content body schemas ──────────────────────────────────────────────────────

export const CreateContentBodySchema = z.object({
  title: z.string().min(1, "Title is required").max(255),
  description: z.string().min(1, "Description is required"),
  type: ContentTypeSchema,
  productId: idField,
  platforms: z.array(PlatformSchema).min(1, "At least one platform is required"),
  scheduledDate: dateString.optional().nullable(),
  createdById: idField,
  assignedToId: idField,
  priority: PrioritySchema,
  tags: z.array(z.string()).optional().default([]),
  mediaUrl: optionalUrl,
  notes: z.string().optional(),
});

export const UpdateStatusBodySchema = z.object({
  status: ContentStatusSchema,
  changedById: idField,
});

export const UpdateContentBodySchema = z
  .object({
    changedById: idField,
    title: z.string().min(1).max(255).optional(),
    description: z.string().optional(),
    type: ContentTypeSchema.optional(),
    priority: PrioritySchema.optional(),
    platforms: z.array(PlatformSchema).min(1).optional(),
    scheduledDate: dateString.optional().nullable(),
    mediaUrl: optionalUrl,
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    order: z.number().optional(),
  })
  .refine(
    (data) => {
      const { changedById, ...rest } = data;
      void changedById;
      return Object.keys(rest).length > 0;
    },
    { message: "At least one field to update is required" }
  );

export const AssignContentBodySchema = z.object({
  assignedToId: idField,
  changedById: idField,
});

export const DeleteContentBodySchema = z.object({
  changedById: idField,
});

// ── Query schemas ─────────────────────────────────────────────────────────────

export const GetContentQuerySchema = z.object({
  search: z.string().optional(),
  productId: z.string().optional(),
  status: ContentStatusSchema.optional(),
  platform: PlatformSchema.optional(),
  assignedToId: z.string().optional(),
  startDate: dateString.optional(),
  endDate: dateString.optional(),
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
});

export const GetActivityQuerySchema = z.object({
  userId: z.string().optional(),
  productId: z.string().optional(),
  contentId: z.string().optional(),
});
