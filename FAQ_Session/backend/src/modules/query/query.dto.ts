import { z } from 'zod';

export const CreateQueryDto = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters').trim(),
  description: z.string().trim().optional(),
});

export const UpdateQueryStatusDto = z.object({
  status: z.enum(['pending', 'resolved']),
});

export type CreateQueryDtoType = z.infer<typeof CreateQueryDto>;
export type UpdateQueryStatusDtoType = z.infer<typeof UpdateQueryStatusDto>;
