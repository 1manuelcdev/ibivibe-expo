export type EventType = 'simple' | 'featured';
export type EventReachLevel = 'local' | 'regional';
export type EventStatus = 'published' | 'draft';

export type EventTag = {
  id: string;
  name: string;
  slug?: string;
};

export type EventCity = {
  id: string;
  name: string;
  slug?: string;
};

export type EventMedia = {
  alt_text?: string | null;
  id: string;
  is_cover?: boolean;
  media_type?: 'image' | 'video' | string;
  position?: number;
  url: string;
};

export type Event = {
  cities?: EventCity[];
  description: string;
  end_date?: string | null;
  id: string;
  medias?: EventMedia[];
  name: string;
  owner_account_id?: string;
  reach_level: EventReachLevel;
  slug: string;
  start_date?: string | null;
  status: EventStatus;
  tags?: EventTag[];
  type: EventType;
  active: boolean;
};

export type CreateEventInput = {
  active: boolean;
  city_ids: string[];
  description: string;
  end_date?: string;
  name: string;
  reach_level: EventReachLevel;
  slug?: string;
  start_date?: string;
  status?: EventStatus;
  tag_ids: string[];
  type: EventType;
};

export type UpdateEventInput = Partial<CreateEventInput>;

export type EventMediaUpload = {
  altText?: string;
  fileName: string;
  isCover?: boolean;
  mimeType: string;
  position?: number;
  uri: string;
};

export type UpdateEventMediaInput = {
  alt_text?: string;
  is_cover?: boolean;
  position?: number;
};
