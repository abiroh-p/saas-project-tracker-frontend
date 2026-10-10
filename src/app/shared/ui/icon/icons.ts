import {
  Check,
  ChevronDown,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Folder,
  Info,
  LayoutDashboard,
  ListChecks,
  Lock,
  LogOut,
  Mail,
  Menu,
  TriangleAlert,
  User,
  X,
} from 'lucide';

/**
 * Icons available to `<app-icon>`. Add an import + entry here to make a new Lucide icon available;
 * unused icons are tree-shaken out of the bundle.
 */
export const ICONS = {
  check: Check,
  'chevron-down': ChevronDown,
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  eye: Eye,
  'eye-off': EyeOff,
  folder: Folder,
  info: Info,
  'layout-dashboard': LayoutDashboard,
  'list-checks': ListChecks,
  lock: Lock,
  'log-out': LogOut,
  mail: Mail,
  menu: Menu,
  'triangle-alert': TriangleAlert,
  user: User,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;
