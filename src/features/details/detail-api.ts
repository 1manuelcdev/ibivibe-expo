import { apiClient } from '@/api/client';
import type { Event } from '@/features/events/models/event-types';

export type DetailMedia = { id?: string; url: string; media_type?: string; is_cover?: boolean };
export type CityDetail = {
  id: string;
  name: string;
  slug?: string;
  description?: string | null;
  tags?: string[];
  media?: DetailMedia[];
};
export type EventDetail = {
  id: string;
  name: string;
  description?: string | null;
  start_date?: string;
  end_date?: string;
  type?: string;
  cities?: Event['cities'];
  medias?: Event['medias'];
  status?: Event['status'];
  tags?: Event['tags'];
};
export type BusinessDetail = {
  id: string;
  name?: string;
  commercial_name?: string;
  bio?: string | null;
  description?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean;
  tags?: string[];
  contact?: Record<string, string | null>;
  locations?: Array<{
    id?: string;
    city?: { id?: string; name?: string };
    is_headquarter?: boolean;
    address?: string | null;
  }>;
  hours?: Array<{
    weekday: number;
    is_closed?: boolean;
    opens_at?: string | null;
    closes_at?: string | null;
  }>;
  services?: Array<{ name: string; price?: number | null }>;
  media?: DetailMedia[];
  reviews?: { average_rating?: number; total_reviews?: number };
  events?: Array<{ id: string; name: string; start_date?: string }>;
};

export const detailApi = {
  async city(id: string) {
    return (await apiClient.get<CityDetail>(`/cities/${id}`)).data;
  },
  async cityMedia(id: string) {
    return (await apiClient.get<DetailMedia[]>(`/cities/${id}/media`)).data;
  },
  async event(id: string) {
    return (await apiClient.get<EventDetail>(`/events/${id}`)).data;
  },
  async business(id: string) {
    return (await apiClient.get<BusinessDetail>(`/businesses/${id}`)).data;
  },
  async businessMedia(id: string) {
    return (await apiClient.get<DetailMedia[]>(`/businesses/${id}/media`)).data;
  },
};
