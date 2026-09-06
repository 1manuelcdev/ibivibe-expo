import { apiClient } from '@/api/client';
import type { BusinessDetail } from '@/features/details/detail-api';
import type { HomeBusiness } from '@/features/home/models/home-types';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';

export type BusinessProfileUpdate = Pick<
  BusinessDetail,
  'bio' | 'commercial_name' | 'description'
> & {
  accessibility?: boolean;
  accepts_payment?: boolean;
  in_person_service?: boolean;
  offers_delivery?: boolean;
  parking?: boolean;
  wifi?: boolean;
};

export type BusinessContactUpdate = {
  facebook?: string | null;
  instagram?: string | null;
  phone?: string | null;
  public_email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
};

type OwnedBusiness = HomeBusiness & { account_id?: string; owner_account_id?: string };

export const businessEditorApi = {
  async getForAccount(accountId: string) {
    const { data } = await apiClient.get<OwnedBusiness[]>('/businesses');
    const business = data.find(
      (item) => item.account_id === accountId || item.owner_account_id === accountId,
    );
    if (!business) throw new Error('Nenhum negócio foi encontrado para esta conta.');
    return business;
  },

  async getEditorData(accountId: string) {
    const business = await businessEditorApi.getForAccount(accountId);
    const [profile, tags] = await Promise.all([
      apiClient.get<BusinessDetail>(`/businesses/${business.id}/public-profile`),
      apiClient.get<OnboardingTag[]>('/tags'),
    ]);
    return { business, profile: profile.data, tags: tags.data };
  },

  async updateProfile(businessId: string, payload: BusinessProfileUpdate) {
    return (await apiClient.patch(`/businesses/${businessId}/profile`, payload)).data;
  },

  async updateContact(businessId: string, payload: BusinessContactUpdate) {
    return (await apiClient.patch(`/businesses/${businessId}/contact`, payload)).data;
  },

  async updateTags(businessId: string, tagIds: string[]) {
    return (await apiClient.put(`/businesses/${businessId}/tags`, { tag_ids: tagIds })).data;
  },
};
