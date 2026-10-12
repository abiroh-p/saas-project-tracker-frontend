export interface Activity {
  id: number;
  user: { id: number; username: string };
  action: string;
  entity_type: 'PROJECT' | 'MEMBERSHIP' | 'ISSUE';
  entity_id: number;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}
