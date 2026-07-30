export interface PaginatedListResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export type ListResponse<T> = T[] | PaginatedListResponse<T>;

export function extractList<T>(response?: ListResponse<T>): T[] {
  if (Array.isArray(response)) return response;
  return Array.isArray(response?.data) ? response.data : [];
}
