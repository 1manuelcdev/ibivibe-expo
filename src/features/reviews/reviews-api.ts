import { apiClient } from '@/api/client';

export type Review = {
  id: string;
  account_id: string;
  business_id: string | null;
  event_id: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  updated_at: string;
  account?: {
    avatar_url?: string | null;
    display_name?: string | null;
    id: string;
  };
};

export type CreateReviewInput = {
  rating: number;
  comment?: string;
} & ({ business_id: string; event_id?: never } | { business_id?: never; event_id: string });

export type UpdateReviewInput = {
  rating: number;
  comment?: string;
};

export const reviewsApi = {
  async list(kind: 'business' | 'event', entityId: string) {
    return (
      await apiClient.get<Review[]>('/reviews', {
        params: kind === 'business' ? { businessId: entityId } : { eventId: entityId },
      })
    ).data;
  },

  async create(input: CreateReviewInput) {
    return (await apiClient.post<Review>('/reviews', input)).data;
  },

  async update(id: string, input: UpdateReviewInput) {
    return (await apiClient.patch<Review>(`/reviews/${id}`, input)).data;
  },
};
