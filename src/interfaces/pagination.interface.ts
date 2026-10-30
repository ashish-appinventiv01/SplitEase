export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  order: "asc" | "desc";
}

export interface PaginationResult extends PaginationOptions {
  skip: number;
}

export interface PaginationMetadata {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
