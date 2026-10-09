import type { Event } from '@/features/events/models/event-types';

export type HomeEvent = {
  active?: boolean;
  cities?: Event['cities'];
  id: string;
  name: string;
  medias?: Event['medias'];
  reach_level?: Event['reach_level'];
  start_date?: string;
  end_date?: string;
  status?: Event['status'];
  tags?: Event['tags'];
  type?: Event['type'];
};

export type HomeBusiness = {
  id: string;
  name?: string;
  commercial_name?: string;
  avatar_url?: string | null;
  tags?: string[];
};

export type HomeCity = {
  id: string;
  name: string;
  tags?: string[];
};
