export type ProjectRole = 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'VIEWER';

export const PROJECT_ROLE_LABELS: Record<ProjectRole, string> = {
  PROJECT_MANAGER: 'Project Manager',
  TEAM_MEMBER: 'Team Member',
  VIEWER: 'Viewer',
};

export const PROJECT_ROLES: readonly ProjectRole[] = ['PROJECT_MANAGER', 'TEAM_MEMBER', 'VIEWER'];

export interface Project {
  id: number;
  /** Immutable. Prefix of issue keys, e.g. `DEMO` → `DEMO-12`. */
  key: string;
  name: string;
  description: string;
  /** ISO date (`YYYY-MM-DD`) or null. */
  start_date: string | null;
  end_date: string | null;
  /** Username of the creator. */
  created_by: string;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
  /** The signed-in user's role in this project. */
  my_role: ProjectRole | null;
}

/** Payload for creating or editing a project. `key` is only accepted on create. */
export interface ProjectWrite {
  key?: string;
  name: string;
  description: string;
  start_date: string | null;
  end_date: string | null;
}

export interface ProjectMember {
  /** Membership id (used in member URLs), not the user id. */
  id: number;
  user_id: number;
  username: string;
  full_name: string;
  email: string;
  role: ProjectRole;
  created_at: string;
}

export interface AddProjectMemberRequest {
  user_id: number;
  role: ProjectRole;
}
