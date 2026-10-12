import type { UserSummary } from './user';

export type IssueType = 'TASK' | 'BUG' | 'STORY' | 'EPIC';
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type IssueStatus = 'TODO' | 'IN_PROGRESS' | 'IN_REVIEW' | 'DONE';

export const ISSUE_TYPES: readonly IssueType[] = ['TASK', 'BUG', 'STORY', 'EPIC'];
export const ISSUE_PRIORITIES: readonly IssuePriority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
export const ISSUE_STATUSES: readonly IssueStatus[] = ['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE'];
export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  TODO: 'To do', IN_PROGRESS: 'In progress', IN_REVIEW: 'In review', DONE: 'Done',
};
export const ISSUE_PRIORITY_LABELS: Record<IssuePriority, string> = {
  LOW: 'Low', MEDIUM: 'Medium', HIGH: 'High', URGENT: 'Urgent',
};

export interface Issue {
  id: number;
  issue_key: string;
  issue_number: number;
  project: number;
  title: string;
  description: string;
  issue_type: IssueType;
  priority: IssuePriority;
  status: IssueStatus;
  reporter: string;
  assignee: number | null;
  reporter_detail: UserSummary;
  assignee_detail: UserSummary | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  is_archived: boolean;
}

export interface IssueWrite {
  title: string;
  description?: string;
  issue_type?: IssueType;
  priority?: IssuePriority;
  assignee?: number | null;
  due_date?: string | null;
}

export type IssueFilters = Partial<{
  project: number;
  search: string;
  status: IssueStatus;
  priority: IssuePriority;
  issue_type: IssueType;
  assignee: string;
  due_before: string;
  due_after: string;
  ordering: string;
}>;
