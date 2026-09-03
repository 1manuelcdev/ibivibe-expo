import { apiClient } from '@/api/client';
import type { Favorite } from '@/features/favorites/models/favorite-types';

export const favoritesApi = {
  async list(accountId: string) {
    const { data } = await apiClient.get<Favorite[]>('/favorites', {
      params: { account_id: accountId },
    });
    return data;
  },

  async remove(id: string) {
    await apiClient.delete(`/favorites/${id}`);
  },

  async add(input: {
    account_id: string;
    city_id?: string;
    business_id?: string;
    event_id?: string;
  }) {
    const { data } = await apiClient.post<Favorite>('/favorites', input);
    return data;
  },
};
