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

export type NovelStatus = 'uploaded' | 'processing' | 'parsed' | 'failed';
export type WorkflowStatus = 'pending' | 'running' | 'waiting_review' | 'completed' | 'failed' | 'canceled';

export interface NovelSource {
  id: number;
  title: string;
  author: string | null;
  original_filename: string;
  stored_path: string;
  file_size: number;
  file_hash: string;
  cover_path: string | null;
  status: NovelStatus;
  chapter_count: number;
  part_count: number;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export interface NovelListParams {
  status?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}

export type NovelListResponse = PaginatedResponse<NovelSource>;

export interface NovelChapter {
  id: number;
  novel_id: number;
  chapter_index: number;
  title: string;
  content?: string | null;
  word_count: number;
  start_offset: number;
  end_offset: number;
  created_at: string;
}

export interface NovelPart {
  id: number;
  novel_id: number;
  part_index: number;
  title: string;
  chapter_start: number;
  chapter_end: number;
  content?: string | null;
  word_count: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowRun {
  id: number;
  workflow_type: string;
  biz_type: string;
  biz_id: number | null;
  title: string;
  status: WorkflowStatus;
  progress: number;
  current_node: string | null;
  input_payload: Record<string, unknown>;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type WorkflowListResponse = PaginatedResponse<WorkflowRun>;

export interface WorkflowTask {
  id: number;
  run_id: number;
  node_name: string;
  agent_name: string | null;
  task_type: string;
  status: string;
  progress: number;
  input_ref: string | null;
  output_ref: string | null;
  retry_count: number;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkflowEvent {
  id: number;
  run_id: number;
  task_id: number | null;
  event_type: string;
  level: string;
  message: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface Artifact {
  id: number;
  run_id: number;
  task_id: number | null;
  artifact_type: string;
  title: string;
  content: string | null;
  structured_data: Record<string, unknown>;
  version: number;
  status: string;
  source_refs: Record<string, unknown>[];
  created_by_agent: string | null;
  created_at: string;
  updated_at: string;
}

export type ArtifactListResponse = PaginatedResponse<Artifact>;

export interface AgentDefinition {
  id: number;
  name: string;
  role: string;
  description: string | null;
  system_prompt: string;
  provider_id: number | null;
  model: string;
  temperature: number;
  max_tokens: number;
  tools: string[];
  output_schema: Record<string, unknown> | null;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentDefinitionUpdate {
  role?: string;
  description?: string | null;
  system_prompt?: string;
  provider_id?: number | null;
  model?: string;
  temperature?: number;
  max_tokens?: number;
  tools?: string[];
  output_schema?: Record<string, unknown> | null;
  enabled?: boolean;
}

// API Response types
export interface ApiError {
  detail: string;
}

// AI Provider types
export type ProviderStatus = 'untested' | 'connected' | 'failed';

export interface AIProvider {
  id: number;
  name: string;
  provider_type: string;
  base_url: string;
  has_api_key: boolean;
  api_key_masked: string;
  models: string[];
  status: ProviderStatus;
  created_at: string;
  updated_at: string;
}

export interface AIProviderCreate {
  name: string;
  base_url: string;
  api_key: string;
  models?: string[];
}

export interface AIProviderUpdate {
  name?: string;
  base_url?: string;
  api_key?: string;
  models?: string[];
}

export const KNOWN_PROVIDERS: { name: string; base_url: string }[] = [
  { name: 'OpenAI', base_url: 'https://api.openai.com/v1' },
  { name: 'Anthropic', base_url: 'https://api.anthropic.com/v1' },
  { name: 'SiliconFlow', base_url: 'https://api.siliconflow.cn/v1' },
  { name: 'DeepSeek', base_url: 'https://api.deepseek.com/v1' },
  { name: 'MiniMax 国内', base_url: 'https://api.minimaxi.com/v1' },
  { name: 'MiniMax 海外', base_url: 'https://api.minimax.io/v1' },
  { name: 'Moonshot', base_url: 'https://api.moonshot.cn/v1' },
  { name: 'ZhipuAI', base_url: 'https://open.bigmodel.cn/api/paas/v4' },
  { name: 'Qwen', base_url: 'https://dashscope.aliyuncs.com/compatible-mode/v1' },
  { name: 'Groq', base_url: 'https://api.groq.com/openai/v1' },
  { name: 'Mistral', base_url: 'https://api.mistral.ai/v1' },
  { name: 'Together AI', base_url: 'https://api.together.xyz/v1' },
  { name: 'OpenRouter', base_url: 'https://openrouter.ai/api/v1' },
  { name: 'xAI', base_url: 'https://api.x.ai/v1' },
];
