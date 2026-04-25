import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { materialsApi, tagsApi, searchApi, categoriesApi, statsApi } from '@/lib/api';
import type { MaterialCreate, MaterialUpdate, TagCreate, SearchParams } from '@/types';

export function useMaterials(params?: {
  category?: string;
  subcategory?: string;
  status?: string;
  keyword?: string;
  page?: number;
  limit?: number;
}) {
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
