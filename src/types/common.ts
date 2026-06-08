export type Role = 'ADMIN' | 'STAFF';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
