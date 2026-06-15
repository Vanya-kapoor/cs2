import { z } from 'zod';
import { Roles } from '../../core/constants/roles';

export const UpdateUserRoleDto = z.object({
  role: z.enum([Roles.STUDENT, Roles.ADMIN]),
});

export type UpdateUserRoleDtoType = z.infer<typeof UpdateUserRoleDto>;
