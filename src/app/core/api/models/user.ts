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
