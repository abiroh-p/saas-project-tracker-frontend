import {
  Check,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Info,
  Lock,
  Mail,
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
  'circle-alert': CircleAlert,
  'circle-check': CircleCheck,
  eye: Eye,
  'eye-off': EyeOff,
  info: Info,
  lock: Lock,
  mail: Mail,
  'triangle-alert': TriangleAlert,
  user: User,
  x: X,
} as const;

export type IconName = keyof typeof ICONS;
