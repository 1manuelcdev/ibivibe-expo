export type Account = {
  id: string;
  email: string;
  name?: string;
  display_name?: string;
  slug?: string;
  email_verified?: boolean;
  is_verified?: boolean;
  needs_onboarding?: boolean;
  type?: string;
  [key: string]: unknown;
};

export type AuthResponse = {
  account: Account;
  access_token: string;
  refresh_token: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  name: string;
  slug: string;
  email: string;
  phone_number?: string;
  password: string;
  password_confirm: string;
  display_name: string;
  bio?: string;
  avatar_url?: string;
  type?: string;
};
