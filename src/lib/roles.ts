import type { Role } from '@/types/app';

export function roleHome(role: Role) {
  switch (role) {
    case 'super_admin':
    case 'org_admin':
      return '/admin';
    case 'instructor':
      return '/instructor';
    default:
      return '/student';
  }
}

export const roleLabel: Record<Role, string> = {
  super_admin: 'Super admin',
  org_admin: 'Organization admin',
  instructor: 'Instructor',
  student: 'Student',
};
