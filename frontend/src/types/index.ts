// Material types
export interface Material {
  id: number;
  title: string;
  content: string;
  summary: string | null;
  category: string | null;
  subcategory: string | null;
  source_type: string;
  source_url: string | null;
  status: MaterialStatus;
  value_score: number;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type MaterialStatus =
  | '待整理'
  | '已整理'
  | '采集中'
  | '已使用'
  | '已归档'
  | '已废弃';

export interface MaterialCreate {
  title: string;
  content: string;
  summary?: string;
  category?: string;
  subcategory?: string;
  source_type?: string;
  source_url?: string;
  status?: MaterialStatus;
  value_score?: number;
  tags?: string[];
}

export interface MaterialUpdate {
  title?: string;
  content?: string;
  summary?: string;
  category?: string;
  subcategory?: string;
  source_type?: string;
  source_url?: string;
  status?: MaterialStatus;
  value_score?: number;
  tags?: string[];
}

export type MaterialListResponse = PaginatedResponse<Material>;

// Tag types
export interface Tag {
  id: number;
  name: string;
  tag_type: string;
  created_at: string;
}

export interface TagCreate {
  name: string;
  tag_type?: string;
}

// Search types
export interface SearchResult {
  id: number;
  title: string;
  snippet: string;
  rank: number;
  category: string | null;
  subcategory: string | null;
  tags: string[];
  status: string | null;
  created_at: string | null;
}

export interface SearchParams {
  q?: string;
  category?: string;
  subcategory?: string;
  status?: string;
  tags?: string;
  limit?: number;
}

// Category types
export interface CategoriesResponse {
  categories: Record<string, string[]>;
}

// Stats types
export interface Stats {
  total: number;
  total_tags: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  avg_score: number;
  recent_count: number;
}

// Paginated response
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface MaterialListParams {
  category?: string;
  subcategory?: string;
  status?: string;
  min_score?: number;
  max_score?: number;
  tag?: string;
  keyword?: string;
  sort?: string;
  order?: string;
  page?: number;
  limit?: number;
}

// API Response types
export interface ApiError {
  detail: string;
}
