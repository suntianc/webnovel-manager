import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { artifactsApi, materialsApi, novelsApi, tagsApi, searchApi, categoriesApi, statsApi, workflowsApi } from '@/lib/api';
import type { MaterialCreate, MaterialUpdate, MaterialListParams, NovelListParams, TagCreate, SearchParams } from '@/types';

export function useMaterials(params?: MaterialListParams) {
  return useQuery({
    queryKey: ['materials', params],
    queryFn: () => materialsApi.list(params),
  });
}

export function useMaterial(id: number) {
  return useQuery({
    queryKey: ['materials', id],
    queryFn: () => materialsApi.get(id),
    enabled: !!id,
  });
}

export function useCreateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: MaterialCreate) => materialsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useUpdateMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: MaterialUpdate }) =>
      materialsApi.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['materials', id] });
    },
  });
}

export function useDeleteMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => materialsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: () => tagsApi.list(),
  });
}

export function useCreateTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TagCreate) => tagsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => tagsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
}

export function useSearch(params: SearchParams) {
  return useQuery({
    queryKey: ['search', params],
    queryFn: () => searchApi.search(params),
    enabled: !!params.q || !!params.category || !!params.tags,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesApi.get(),
  });
}

export function useStats() {
  return useQuery({
    queryKey: ['stats'],
    queryFn: () => statsApi.get(),
  });
}

export function useNovels(params?: NovelListParams) {
  return useQuery({
    queryKey: ['novels', params],
    queryFn: () => novelsApi.list(params),
    refetchInterval: 2000,
  });
}

export function useNovel(id: number) {
  return useQuery({
    queryKey: ['novels', id],
    queryFn: () => novelsApi.get(id),
    enabled: !!id,
    refetchInterval: 2000,
  });
}

export function useUploadNovel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => novelsApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
    },
  });
}

export function useDeleteNovel() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => novelsApi.delete(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.removeQueries({ queryKey: ['novels', id] });
      queryClient.removeQueries({ queryKey: ['novel-parts', id] });
      queryClient.removeQueries({ queryKey: ['novel-chapters', id] });
    },
  });
}

export function useGenerateNovelParts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, chaptersPerPart }: { id: number; chaptersPerPart: number }) =>
      novelsApi.generateParts({ id, chaptersPerPart }),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['novels'] });
      queryClient.invalidateQueries({ queryKey: ['novel-parts', id] });
      queryClient.invalidateQueries({ queryKey: ['novels', id] });
    },
  });
}

export function useStartNovelAnalysis() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => novelsApi.startAnalysis(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['novels', id] });
    },
  });
}

export function useNovelParts(id: number) {
  return useQuery({
    queryKey: ['novel-parts', id],
    queryFn: () => novelsApi.parts(id),
    enabled: !!id,
  });
}

export function useNovelChapters(id: number) {
  return useQuery({
    queryKey: ['novel-chapters', id],
    queryFn: () => novelsApi.chapters(id),
    enabled: !!id,
  });
}

export function useWorkflows(params?: { status?: string; workflow_type?: string; biz_type?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['workflows', params],
    queryFn: () => workflowsApi.list(params),
    refetchInterval: 1000,
  });
}

export function useWorkflowTasks(id: number) {
  return useQuery({
    queryKey: ['workflow-tasks', id],
    queryFn: () => workflowsApi.tasks(id),
    enabled: !!id,
  });
}

export function useWorkflowEvents(id: number) {
  return useQuery({
    queryKey: ['workflow-events', id],
    queryFn: () => workflowsApi.events(id),
    enabled: !!id,
  });
}

export function useResumeWorkflow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => workflowsApi.resume(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      queryClient.invalidateQueries({ queryKey: ['workflow-events', id] });
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks', id] });
      queryClient.invalidateQueries({ queryKey: ['artifacts'] });
    },
  });
}

export function useArtifacts(params?: { run_id?: number; artifact_type?: string; status?: string; page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['artifacts', params],
    queryFn: () => artifactsApi.list(params),
    enabled: !!params?.run_id,
  });
}
