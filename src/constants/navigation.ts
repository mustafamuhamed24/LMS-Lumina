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
import type { MessageKey } from '@/lib/i18n/messages';
import type { Role } from '@/types/app';

export type NavItem = {
  labelKey: MessageKey;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
  superAdminOnly?: boolean;
};

export type NavGroup = {
  labelKey: MessageKey;
  items: NavItem[];
};

const adminNav: NavGroup[] = [
  {
    labelKey: 'nav.group.overview',
    items: [
      { labelKey: 'nav.dashboard', href: '/admin', icon: LayoutDashboard, exact: true },
      { labelKey: 'nav.platform', href: '/admin/platform', icon: ShieldCheck, superAdminOnly: true },
    ],
  },
  {
    labelKey: 'nav.group.manage',
    items: [
      { labelKey: 'nav.users', href: '/admin/users', icon: Users },
      { labelKey: 'nav.organizations', href: '/admin/organizations', icon: Building2, superAdminOnly: true },
      { labelKey: 'nav.courses', href: '/admin/courses', icon: BookOpen },
      { labelKey: 'nav.categories', href: '/admin/categories', icon: FolderTree },
      { labelKey: 'nav.enrollments', href: '/admin/enrollments', icon: ClipboardCheck },
    ],
  },
  {
    labelKey: 'nav.group.insights',
    items: [
      { labelKey: 'nav.analytics', href: '/admin/analytics', icon: BarChart3 },
      { labelKey: 'nav.settings', href: '/admin/settings', icon: Settings },
    ],
  },
];

const instructorNav: NavGroup[] = [
  {
    labelKey: 'nav.group.workspace',
    items: [
      { labelKey: 'nav.dashboard', href: '/instructor', icon: LayoutDashboard, exact: true },
      { labelKey: 'nav.myCourses', href: '/instructor/courses', icon: BookOpen },
      { labelKey: 'nav.students', href: '/instructor/students', icon: Users },
      { labelKey: 'nav.assignments', href: '/instructor/assignments', icon: ClipboardCheck },
    ],
  },
  {
    labelKey: 'nav.group.insights',
    items: [{ labelKey: 'nav.analytics', href: '/instructor/analytics', icon: BarChart3 }],
  },
];

const studentNav: NavGroup[] = [
  {
    labelKey: 'nav.group.learning',
    items: [
      { labelKey: 'nav.dashboard', href: '/student', icon: LayoutDashboard, exact: true },
      { labelKey: 'nav.myCourses', href: '/student/my-courses', icon: BookOpen },
      { labelKey: 'nav.assignments', href: '/student/assignments', icon: ClipboardCheck },
      { labelKey: 'nav.certificates', href: '/student/certificates', icon: Award },
    ],
  },
  {
    labelKey: 'nav.group.account',
    items: [
      { labelKey: 'nav.notifications', href: '/student/notifications', icon: Bell },
      { labelKey: 'nav.profile', href: '/student/profile', icon: UserRound },
      { labelKey: 'nav.teach', href: '/student/become-instructor', icon: BookOpen },
      { labelKey: 'nav.catalog', href: '/courses', icon: GraduationCap },
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

export const roleLabelKey: Record<Role, MessageKey> = {
  super_admin: 'role.super_admin',
  org_admin: 'role.org_admin',
  instructor: 'role.instructor',
  student: 'role.student',
};

export const fallbackIcon = Layers;
