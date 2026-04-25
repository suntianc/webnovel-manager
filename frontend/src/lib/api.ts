import type {
  Material,
  MaterialCreate,
  MaterialUpdate,
  MaterialListResponse,
  Tag,
  TagCreate,
  SearchResult,
  SearchParams,
  CategoriesResponse,
  Stats,
} from '@/types';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

class ApiError extends Error {
  constructor(public detail: string) {
    super(detail);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
    throw new ApiError(error.detail);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json();
}

// Materials API
export const materialsApi = {
  list: async (params?: {
    category?: string;
    subcategory?: string;
    status?: string;
    keyword?: string;
    page?: number;
    limit?: number;
  }): Promise<MaterialListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.subcategory) searchParams.set('subcategory', params.subcategory);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));

    const response = await fetch(`${API_BASE}/api/materials/?${searchParams}`);
    return handleResponse<MaterialListResponse>(response);
  },

  get: async (id: number): Promise<Material> => {
    const response = await fetch(`${API_BASE}/api/materials/${id}`);
    return handleResponse<Material>(response);
  },

  create: async (data: MaterialCreate): Promise<Material> => {
    const response = await fetch(`${API_BASE}/api/materials/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Material>(response);
  },

  update: async (id: number, data: MaterialUpdate): Promise<Material> => {
    const response = await fetch(`${API_BASE}/api/materials/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Material>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/materials/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Tags API
export const tagsApi = {
  list: async (): Promise<Tag[]> => {
    const response = await fetch(`${API_BASE}/api/tags/`);
    return handleResponse<Tag[]>(response);
  },

  create: async (data: TagCreate): Promise<Tag> => {
    const response = await fetch(`${API_BASE}/api/tags/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<Tag>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/tags/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },
};

// Search API
export const searchApi = {
  search: async (params: SearchParams): Promise<SearchResult[]> => {
    const searchParams = new URLSearchParams();
    if (params.q) searchParams.set('q', params.q);
    if (params.category) searchParams.set('category', params.category);
    if (params.subcategory) searchParams.set('subcategory', params.subcategory);
    if (params.status) searchParams.set('status', params.status);
    if (params.tags) searchParams.set('tags', params.tags);
    if (params.limit) searchParams.set('limit', String(params.limit));

    const response = await fetch(`${API_BASE}/api/search/?${searchParams}`);
    return handleResponse<SearchResult[]>(response);
  },
};

// Categories API
export const categoriesApi = {
  get: async (): Promise<CategoriesResponse> => {
    const response = await fetch(`${API_BASE}/api/categories/`);
    return handleResponse<CategoriesResponse>(response);
  },
};

// Stats API
export const statsApi = {
  get: async (): Promise<Stats> => {
    const response = await fetch(`${API_BASE}/api/stats/`);
    return handleResponse<Stats>(response);
  },
};

export { ApiError };
