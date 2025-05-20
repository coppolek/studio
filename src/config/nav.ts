
import type { LucideIcon } from 'lucide-react';
import { LayoutDashboard, CalendarClock, BarChart3, Settings, Users2, BotMessageSquare } from 'lucide-react'; // Added Users2

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  label?: string;
  disabled?: boolean;
}

export const mainNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Scheduler',
    href: '/scheduler',
    icon: CalendarClock,
  },
  {
    title: 'Analytics',
    href: '/analytics',
    icon: BarChart3,
  },
  {
    title: 'Groups', // New item
    href: '/groups',
    icon: Users2,
  },
];

export const settingsNavItem: NavItem = {
  title: 'Settings',
  href: '/settings',
  icon: Settings,
};

// Example for AI related nav item if needed in future
// export const aiToolsNavItem: NavItem = {
//   title: 'AI Optimizer',
//   href: '/ai-optimizer',
//   icon: BotMessageSquare, 
// };
