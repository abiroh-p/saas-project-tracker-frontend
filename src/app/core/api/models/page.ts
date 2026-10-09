/** Standard paginated response used by list endpoints. */
export interface Page<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}
