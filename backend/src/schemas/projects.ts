import { z } from 'zod';

export const CreateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(2000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
});
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;

export const UpdateProjectSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  description: z.string().trim().max(2000).nullable().optional(),
});
export type UpdateProjectInput = z.infer<typeof UpdateProjectSchema>;

export const InviteMemberSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  role: z.enum(['ADMIN', 'MEMBER']).default('MEMBER'),
});
export type InviteMemberInput = z.infer<typeof InviteMemberSchema>;

export const UpdateMemberSchema = z.object({
  role: z.enum(['ADMIN', 'MEMBER']),
});
export type UpdateMemberInput = z.infer<typeof UpdateMemberSchema>;
