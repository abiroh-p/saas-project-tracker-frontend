import type { IconName } from '../../shared/ui/icon/icons';

export interface NavItem {
  label: string;
  path: string;
  icon: IconName;
}

/** Primary navigation. Add an entry when a feature ships; unfinished areas are not listed. */
export const MAIN_NAV: readonly NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: 'layout-dashboard' },
  { label: 'Projects', path: '/projects', icon: 'folder' },
  { label: 'Issues', path: '/issues', icon: 'list-checks' },
];

export const SETTINGS_NAV: readonly NavItem[] = [
  { label: 'Profile', path: '/settings/profile', icon: 'user' },
  { label: 'Account', path: '/settings/account', icon: 'lock' },
];
