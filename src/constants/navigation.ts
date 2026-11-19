import {
  Award,
  BarChart3,
  Bell,
  BookOpen,
  Building2,
  ClipboardCheck,
  FolderTree,
  GraduationCap,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  Users,
  UserRound,
  Layers,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { Role } from '@/types/app';

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  superAdminOnly?: boolean;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

const adminNav: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { label: 'Platform', href: '/admin/platform', icon: ShieldCheck, superAdminOnly: true },
    ],
  },
  {
    label: 'Manage',
    items: [
      { label: 'Users', href: '/admin/users', icon: Users },
      { label: 'Organizations', href: '/admin/organizations', icon: Building2, superAdminOnly: true },
      { label: 'Courses', href: '/admin/courses', icon: BookOpen },
      { label: 'Categories', href: '/admin/categories', icon: FolderTree },
      { label: 'Enrollments', href: '/admin/enrollments', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
      { label: 'Settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

const instructorNav: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: '/instructor', icon: LayoutDashboard, exact: true },
      { label: 'My courses', href: '/instructor/courses', icon: BookOpen },
      { label: 'Students', href: '/instructor/students', icon: Users },
      { label: 'Assignments', href: '/instructor/assignments', icon: ClipboardCheck },
    ],
  },
  {
    label: 'Insights',
    items: [{ label: 'Analytics', href: '/instructor/analytics', icon: BarChart3 }],
  },
];

const studentNav: NavGroup[] = [
  {
    label: 'Learning',
    items: [
      { label: 'Dashboard', href: '/student', icon: LayoutDashboard, exact: true },
      { label: 'My courses', href: '/student/my-courses', icon: BookOpen },
      { label: 'Assignments', href: '/student/assignments', icon: ClipboardCheck },
      { label: 'Certificates', href: '/student/certificates', icon: Award },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Notifications', href: '/student/notifications', icon: Bell },
      { label: 'Profile', href: '/student/profile', icon: UserRound },
      { label: 'Teach on Learnova', href: '/student/become-instructor', icon: BookOpen },
      { label: 'Browse catalog', href: '/courses', icon: GraduationCap },
    ],
  },
];

export function getNavigation(role: Role): NavGroup[] {
  switch (role) {
    case 'super_admin':
    case 'org_admin':
      return adminNav.map((group) => ({
        ...group,
        items: group.items.filter((item) => !item.superAdminOnly || role === 'super_admin'),
      }));
    case 'instructor':
      return instructorNav;
    default:
      return studentNav;
  }
}

export const roleLabel: Record<Role, string> = {
  super_admin: 'Platform administrator',
  org_admin: 'Organization administrator',
  instructor: 'Instructor',
  student: 'Student',
};

export const fallbackIcon = Layers;
