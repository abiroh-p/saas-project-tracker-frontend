export interface Comment {
  id: number;
  issue: number;
  author: { id: number; username: string };
  body: string | null;
  mentions: Array<{ id: number; username: string }>;
  created_at: string;
  updated_at: string;
  edited_at: string | null;
  is_deleted: boolean;
  deleted_at: string | null;
}
