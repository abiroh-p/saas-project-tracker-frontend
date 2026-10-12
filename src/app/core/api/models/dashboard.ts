import type { IssuePriority, IssueStatus } from './issue';

export interface DashboardIssue {
  id: number;
  issue_key: string;
  title: string;
  status: IssueStatus;
  priority: IssuePriority;
  project_id: number;
  due_date: string | null;
  updated_at: string;
}

export interface Dashboard {
  summary: {
    projects_count: number;
    assigned_issues_count: number;
    in_progress_count: number;
    completed_count: number;
    overdue_count: number;
  };
  issues_by_status: Record<IssueStatus, number>;
  recent_issues: DashboardIssue[];
}
