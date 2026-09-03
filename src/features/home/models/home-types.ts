export type HomeEvent = {
  id: string;
  name: string;
  cover_img_url?: string | null;
  start_date?: string;
  end_date?: string;
  tags?: string[];
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
  cover_img_url?: string | null;
  tags?: string[];
};
