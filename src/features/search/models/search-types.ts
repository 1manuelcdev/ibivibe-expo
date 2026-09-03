export type SearchCity = {
  id: string;
  name: string;
  description?: string | null;
  cover_img_url?: string | null;
};

export type SearchBusiness = {
  id: string;
  name?: string | null;
  commercial_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
};

export type SearchEvent = {
  id: string;
  name: string;
  description?: string | null;
  cover_img_url?: string | null;
};

export type SearchResponse = {
  cities: SearchCity[];
  businesses: SearchBusiness[];
  events: SearchEvent[];
};
