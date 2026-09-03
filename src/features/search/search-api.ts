import { apiClient } from '@/api/client';
import type { SearchResponse } from '@/features/search/models/search-types';

export const searchApi = {
  async search(query: string) {
    const { data } = await apiClient.get<SearchResponse>('/search', { params: { q: query } });
    return data;
  },
};
