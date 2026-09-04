import { apiClient } from '@/api/client';
import type {
  AccountInterestsInput,
  BusinessOnboardingInput,
  OnboardingCity,
  OnboardingTag,
  OnboardingTagGroup,
} from '@/features/onboarding/models/onboarding-types';

export const onboardingApi = {
  async getCities() {
    return (await apiClient.get<OnboardingCity[]>('/cities')).data;
  },

  async getTagGroups() {
    return (await apiClient.get<OnboardingTagGroup[]>('/tags/groups')).data;
  },

  async getTags() {
    return (await apiClient.get<OnboardingTag[]>('/tags')).data;
  },

  async saveInterests(accountId: string, interests: AccountInterestsInput) {
    return (await apiClient.patch(`/accounts/${accountId}/interests`, interests)).data;
  },

  async createBusiness(input: BusinessOnboardingInput) {
    return (await apiClient.post('/businesses/onboarding', input)).data;
  },
};
