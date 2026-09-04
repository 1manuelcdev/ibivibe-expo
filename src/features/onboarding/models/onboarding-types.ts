export type OnboardingTag = {
  id: string;
  name: string;
  group_id: string;
};

export type OnboardingTagGroup = {
  id: string;
  name: string;
};

export type OnboardingCity = {
  id: string;
  name: string;
  state?: string | null;
};

export type AccountInterestsInput = {
  businesses: string[];
  events: string[];
};

export type BusinessOnboardingInput = {
  branch_city_ids?: string[];
  cnpj: string;
  headquarters_city_id: string;
  name: string;
};
