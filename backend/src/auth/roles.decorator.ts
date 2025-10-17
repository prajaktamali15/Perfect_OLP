// src/auth/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client'; // Prisma Role enum

/**
 * Assigns roles to a route handler.
 * Example: @Roles(Role.ADMIN, Role.INSTRUCTOR)
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Optional constant for accessing metadata in guard
export const ROLES_KEY = 'roles';
