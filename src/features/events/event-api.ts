import { apiClient } from '@/api/client';
import type {
  CreateEventInput,
  Event,
  EventMedia,
  EventMediaUpload,
  UpdateEventInput,
  UpdateEventMediaInput,
} from '@/features/events/models/event-types';

export const eventApi = {
  async create(input: CreateEventInput) {
    return (await apiClient.post<Event>('/events', input)).data;
  },

  async getOwned() {
    return (await apiClient.get<Event[]>('/events/owned')).data;
  },

  async getOne(eventId: string) {
    return (await apiClient.get<Event>(`/events/${eventId}`)).data;
  },

  async update(eventId: string, input: UpdateEventInput) {
    return (await apiClient.patch<Event>(`/events/${eventId}`, input)).data;
  },

  async publish(eventId: string) {
    return (await apiClient.patch<Event>(`/events/${eventId}/publish`)).data;
  },

  async remove(eventId: string) {
    return (await apiClient.delete(`/events/${eventId}`)).data;
  },

  async getMedia(eventId: string) {
    return (await apiClient.get<EventMedia[]>(`/events/${eventId}/media`)).data;
  },

  async uploadMedia(eventId: string, media: EventMediaUpload) {
    const form = new FormData();
    form.append('file', {
      name: media.fileName,
      type: media.mimeType,
      uri: media.uri,
    } as unknown as Blob);
    if (media.isCover !== undefined) form.append('is_cover', String(media.isCover));
    if (media.position !== undefined) form.append('position', String(media.position));
    if (media.altText) form.append('alt_text', media.altText);

    return (
      await apiClient.post<EventMedia>(`/events/${eventId}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data;
  },

  async updateMedia(eventId: string, mediaId: string, input: UpdateEventMediaInput) {
    return (await apiClient.patch<EventMedia>(`/events/${eventId}/media/${mediaId}`, input)).data;
  },

  async reorderMedia(eventId: string, mediaIds: string[]) {
    return (await apiClient.patch(`/events/${eventId}/media/order`, { media_ids: mediaIds })).data;
  },

  async deleteMedia(eventId: string, mediaId: string) {
    return (await apiClient.delete(`/events/${eventId}/media/${mediaId}`)).data;
  },
};
