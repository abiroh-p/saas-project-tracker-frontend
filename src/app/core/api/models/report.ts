import type { IssuePriority, IssueStatus } from './issue';

export interface ProjectOverviewReport {
  project_id: number; project_key: string; total_issues: number; open_issues: number;
  in_progress_issues: number; completed_issues: number; overdue_issues: number;
  unassigned_issues: number; completion_rate: number;
}
export interface StatusDistributionReport {
  project_id: number; results: Array<{ status: IssueStatus; label: string; count: number }>;
  other_count: number; total_issues: number;
}
export interface PriorityDistributionReport {
  project_id: number; results: Array<{ priority: IssuePriority; label: string; count: number }>;
  other_count: number; total_issues: number;
}
export interface AssigneeWorkloadReport {
  project_id: number;
  results: Array<{ assignee_id: number | null; username: string | null; full_name: string | null; assigned_issues: number; open_issues: number; in_progress_issues: number; completed_issues: number; overdue_issues: number }>;
  total_issues: number;
}
export interface TrendsReport {
  project_id: number; interval: 'day' | 'week'; date_from: string; date_to: string;
  results: Array<{ period: string; created_count: number; completed_count: number }>;
}
