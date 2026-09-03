import { apiClient } from '@/api/client';
import type { HomeBusiness, HomeCity, HomeEvent } from '@/features/home/models/home-types';

export const homeApi = {
  async getEvents() {
    const { data } = await apiClient.get<HomeEvent[]>('/events');
    return data;
  },

  async getBusinesses() {
    const { data } = await apiClient.get<HomeBusiness[]>('/businesses');
    return data;
  },

  async getCities() {
    const { data } = await apiClient.get<HomeCity[]>('/cities');
    return data;
  },
};
