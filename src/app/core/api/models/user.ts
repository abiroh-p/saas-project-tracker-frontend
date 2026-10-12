export type UserRole = 'ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER';

export interface User {
  id: number;
  /** Generated from the email at sign-up; used as a sign-in identifier and in `@mentions`. */
  username: string;
  email: string;
  /** Empty for accounts created before full names existed. Prefer `displayName` in the UI. */
  full_name: string;
  role: UserRole;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
};

/** Fields the signed-in user may change on their own profile. */
export interface ProfileUpdate {
  full_name?: string;
  email?: string;
}

/** What the user picker returns: enough to identify a person, never their email. */
export interface UserSummary {
  id: number;
  username: string;
  full_name: string;
}

/** Full name, falling back to the username for accounts that have none. */
export function displayNameOf(person: { full_name: string; username: string }): string {
  return person.full_name.trim() || person.username;
}
