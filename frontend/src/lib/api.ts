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
  NovelListParams,
  NovelListResponse,
  NovelSource,
  NovelChapter,
  NovelPart,
  WorkflowListResponse,
  WorkflowRun,
  WorkflowTask,
  WorkflowEvent,
  ArtifactListResponse,
  AIProvider,
  AIProviderCreate,
  AIProviderUpdate,
} from '@/types';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

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
  list: async (params?: import('@/types').MaterialListParams): Promise<MaterialListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.category) searchParams.set('category', params.category);
    if (params?.subcategory) searchParams.set('subcategory', params.subcategory);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.min_score !== undefined) searchParams.set('min_score', String(params.min_score));
    if (params?.max_score !== undefined) searchParams.set('max_score', String(params.max_score));
    if (params?.tag) searchParams.set('tag', params.tag);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.sort) searchParams.set('sort', params.sort);
    if (params?.order) searchParams.set('order', params.order);
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

export const novelsApi = {
  list: async (params?: NovelListParams): Promise<NovelListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.keyword) searchParams.set('keyword', params.keyword);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const response = await fetch(`${API_BASE}/api/novels/?${searchParams}`);
    return handleResponse<NovelListResponse>(response);
  },

  get: async (id: number): Promise<NovelSource> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}`);
    return handleResponse<NovelSource>(response);
  },

  upload: async (file: File): Promise<NovelSource> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`${API_BASE}/api/novels/upload`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse<NovelSource>(response);
  },

  parse: async (id: number): Promise<NovelSource> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}/parse`, { method: 'POST' });
    return handleResponse<NovelSource>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}`, { method: 'DELETE' });
    return handleResponse<void>(response);
  },

  chapters: async (id: number, includeContent = false): Promise<NovelChapter[]> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}/chapters?include_content=${includeContent}`);
    return handleResponse<NovelChapter[]>(response);
  },

  parts: async (id: number, includeContent = false): Promise<NovelPart[]> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}/parts?include_content=${includeContent}`);
    return handleResponse<NovelPart[]>(response);
  },

  generateParts: async ({ id, chaptersPerPart }: { id: number; chaptersPerPart: number }): Promise<NovelPart[]> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}/parts/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chapters_per_part: chaptersPerPart, overwrite: true }),
    });
    return handleResponse<NovelPart[]>(response);
  },

  startAnalysis: async (id: number): Promise<{ workflow: WorkflowRun }> => {
    const response = await fetch(`${API_BASE}/api/novels/${id}/analysis/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    return handleResponse<{ workflow: WorkflowRun }>(response);
  },
};

export const workflowsApi = {
  list: async (params?: { status?: string; workflow_type?: string; biz_type?: string; page?: number; limit?: number }): Promise<WorkflowListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.workflow_type) searchParams.set('workflow_type', params.workflow_type);
    if (params?.biz_type) searchParams.set('biz_type', params.biz_type);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const response = await fetch(`${API_BASE}/api/workflows/?${searchParams}`);
    return handleResponse<WorkflowListResponse>(response);
  },

  get: async (id: number): Promise<WorkflowRun> => {
    const response = await fetch(`${API_BASE}/api/workflows/${id}`);
    return handleResponse<WorkflowRun>(response);
  },

  tasks: async (id: number): Promise<WorkflowTask[]> => {
    const response = await fetch(`${API_BASE}/api/workflows/${id}/tasks`);
    return handleResponse<WorkflowTask[]>(response);
  },

  events: async (id: number, afterId = 0): Promise<WorkflowEvent[]> => {
    const response = await fetch(`${API_BASE}/api/workflows/${id}/events?after_id=${afterId}`);
    return handleResponse<WorkflowEvent[]>(response);
  },

  resume: async (id: number): Promise<WorkflowRun> => {
    const response = await fetch(`${API_BASE}/api/workflows/${id}/resume`, { method: 'POST' });
    return handleResponse<WorkflowRun>(response);
  },

  retry: async (id: number): Promise<WorkflowRun> => {
    const response = await fetch(`${API_BASE}/api/workflows/${id}/retry`, { method: 'POST' });
    return handleResponse<WorkflowRun>(response);
  },
};

export const artifactsApi = {
  list: async (params?: { run_id?: number; artifact_type?: string; status?: string; page?: number; limit?: number }): Promise<ArtifactListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.run_id) searchParams.set('run_id', String(params.run_id));
    if (params?.artifact_type) searchParams.set('artifact_type', params.artifact_type);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const response = await fetch(`${API_BASE}/api/artifacts/?${searchParams}`);
    return handleResponse<ArtifactListResponse>(response);
  },
};


export const providersApi = {
  list: async (): Promise<AIProvider[]> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/`);
    return handleResponse<AIProvider[]>(response);
  },

  get: async (id: number): Promise<AIProvider> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/${id}`);
    return handleResponse<AIProvider>(response);
  },

  create: async (data: AIProviderCreate): Promise<AIProvider> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AIProvider>(response);
  },

  update: async (id: number, data: AIProviderUpdate): Promise<AIProvider> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<AIProvider>(response);
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/${id}`, {
      method: 'DELETE',
    });
    return handleResponse<void>(response);
  },

  testConnection: async (id: number): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/${id}/test`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  testConfig: async (data: AIProviderCreate): Promise<{ status: string; message: string }> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  fetchModels: async (id: number): Promise<{ models: string[] }> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/${id}/models/fetch`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  fetchModelsForConfig: async (data: AIProviderCreate): Promise<{ models: string[] }> => {
    const response = await fetch(`${API_BASE}/api/ai-providers/models/fetch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

export { ApiError };
