import { z } from 'zod';

const StatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'DONE']);
const PriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const CreateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(5000).optional().or(z.literal('')).transform((v) => (v ? v : undefined)),
  status: StatusEnum.default('TODO'),
  priority: PriorityEnum.default('MEDIUM'),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().min(1).nullable().optional(),
});
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const UpdateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  dueDate: z.string().datetime().nullable().optional(),
  assigneeId: z.string().min(1).nullable().optional(),
  position: z.number().int().min(0).optional(),
});
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;

export const UpdateTaskStatusSchema = z.object({
  status: StatusEnum,
  position: z.number().int().min(0).optional(),
});
export type UpdateTaskStatusInput = z.infer<typeof UpdateTaskStatusSchema>;

export const CreateCommentSchema = z.object({
  body: z.string().trim().min(1).max(2000),
});
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;

export const TaskFilterSchema = z.object({
  status: StatusEnum.optional(),
  priority: PriorityEnum.optional(),
  assigneeId: z.string().optional(),
  overdue: z.enum(['true', 'false']).optional(),
});
export type TaskFilter = z.infer<typeof TaskFilterSchema>;
