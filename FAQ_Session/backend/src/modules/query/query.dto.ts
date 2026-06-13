import { z } from 'zod';

export const CreateQueryDto = z.object({
  title: z.string().min(5).max(200),
  description: z.string().min(10).optional(),
  screenshot: z.string().optional().nullable(), // base64 data URI
});

export type CreateQueryDtoType = z.infer<typeof CreateQueryDto>;
