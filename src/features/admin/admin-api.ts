import { apiClient } from '@/api/client';
import type { PreparedImage } from '@/features/businesses/image-upload-service';
import type { EventMediaUpload, UpdateEventMediaInput } from '@/features/events/models/event-types';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';

export type AdminCity = {
  description?: string | null;
  id: string;
  location?: { coordinates?: [number, number]; type?: string } | null;
  name: string;
  slug?: string;
  tags?: Array<Pick<OnboardingTag, 'id' | 'name' | 'slug'>>;
};

export type AdminCityUpdate = {
  description?: string | null;
  latitude?: number;
  longitude?: number;
  name?: string;
  slug?: string;
};

export type AdminCityMedia = {
  alt_text?: string | null;
  id: string;
  is_cover?: boolean;
  media_type?: string;
  position?: number;
  url: string;
};

export type AdminOverview = {
  accounts: number;
  businesses: number;
  cities: number;
  events: number;
  generated_at: string;
  leads: number;
  reviews: number;
};

export type AdminTag = {
  color?: string | null;
  description?: string | null;
  group?: { id: string; name: string } | null;
  group_id: string;
  id: string;
  name: string;
  position?: number;
  slug: string;
};

export type AdminTagUpdate = Pick<AdminTag, 'color' | 'description' | 'name' | 'position'>;

export const adminApi = {
  async getOverview() {
    return (await apiClient.get<AdminOverview>('/admin/overview')).data;
  },

  async getTags() {
    return (await apiClient.get<AdminTag[]>('/admin/resources/tags')).data;
  },

  async updateTag(tagId: string, payload: Partial<AdminTagUpdate>) {
    return (await apiClient.patch<AdminTag>(`/admin/resources/tags/${tagId}`, payload)).data;
  },

  async deleteTag(tagId: string) {
    return (await apiClient.delete(`/admin/resources/tags/${tagId}`)).data;
  },

  async getCities() {
    return (await apiClient.get<AdminCity[]>('/admin/resources/cities')).data;
  },

  async updateCity(cityId: string, payload: AdminCityUpdate) {
    return (await apiClient.patch<AdminCity>(`/admin/resources/cities/${cityId}`, payload)).data;
  },

  async updateCityTags(cityId: string, tagIds: string[]) {
    return (
      await apiClient.put<AdminCity>(`/admin/resources/cities/${cityId}/tags`, {
        tag_ids: tagIds,
      })
    ).data;
  },

  async getCityMedia(cityId: string) {
    return (await apiClient.get<AdminCityMedia[]>(`/admin/resources/cities/${cityId}/media`)).data;
  },

  async uploadCityMedia(cityId: string, media: EventMediaUpload | PreparedImage) {
    const form = new FormData();
    form.append('file', {
      name: media.fileName,
      type: media.mimeType,
      uri: media.uri,
    } as unknown as Blob);
    if ('isCover' in media && media.isCover !== undefined)
      form.append('is_cover', String(media.isCover));
    if ('position' in media && media.position !== undefined)
      form.append('position', String(media.position));
    if ('altText' in media && media.altText) form.append('alt_text', media.altText);

    return (
      await apiClient.post<AdminCityMedia>(`/admin/resources/cities/${cityId}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },

  async updateCityMedia(cityId: string, mediaId: string, input: UpdateEventMediaInput) {
    return (
      await apiClient.patch<AdminCityMedia>(
        `/admin/resources/cities/${cityId}/media/${mediaId}`,
        input,
      )
    ).data;
  },

  async reorderCityMedia(cityId: string, mediaIds: string[]) {
    return (
      await apiClient.patch(`/admin/resources/cities/${cityId}/media/order`, {
        media_ids: mediaIds,
      })
    ).data;
  },

  async deleteCityMedia(cityId: string, mediaId: string) {
    return (await apiClient.delete(`/admin/resources/cities/${cityId}/media/${mediaId}`)).data;
  },
};
