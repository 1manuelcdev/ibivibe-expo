import { apiClient } from '@/api/client';
import type { PreparedImage } from '@/features/businesses/image-upload-service';
import type { BusinessDetail } from '@/features/details/detail-api';
import type { HomeBusiness } from '@/features/home/models/home-types';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';

export type BusinessProfileUpdate = Pick<BusinessDetail, 'commercial_name' | 'description'> & {
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

export type BusinessUploadImage = Pick<PreparedImage, 'fileName' | 'mimeType' | 'uri'>;
export type UploadImageOptions = {
  onProgress?: (progress: number) => void;
  signal?: AbortSignal;
};

export type BusinessMedia = {
  alt_text?: string | null;
  id: string;
  is_cover?: boolean;
  media_type?: string;
  position?: number;
  url: string;
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

  async uploadProfilePhoto(
    businessId: string,
    photo: BusinessUploadImage,
    options?: UploadImageOptions,
  ) {
    const form = createImageForm(photo, 'foto-de-perfil.webp');

    return (
      await apiClient.post(`/businesses/${businessId}/profile-photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => reportProgress(event.loaded, event.total, options?.onProgress),
        signal: options?.signal,
      })
    ).data;
  },

  async getMedia(businessId: string) {
    return (await apiClient.get<BusinessMedia[]>(`/businesses/${businessId}/media`)).data;
  },

  async uploadMedia(businessId: string, media: BusinessUploadImage, options?: UploadImageOptions) {
    const form = createImageForm(media, 'galeria.webp');

    return (
      await apiClient.post<BusinessMedia>(`/businesses/${businessId}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => reportProgress(event.loaded, event.total, options?.onProgress),
        signal: options?.signal,
      })
    ).data;
  },

  async reorderMedia(businessId: string, mediaIds: string[]) {
    return (await apiClient.patch(`/businesses/${businessId}/media/order`, { media_ids: mediaIds }))
      .data;
  },

  async deleteMedia(businessId: string, mediaId: string) {
    return (await apiClient.delete(`/businesses/${businessId}/media/${mediaId}`)).data;
  },
};

function createImageForm(image: BusinessUploadImage, fallbackName: string) {
  const form = new FormData();
  form.append('file', {
    name: image.fileName || fallbackName,
    type: image.mimeType || 'image/webp',
    uri: image.uri,
  } as unknown as Blob);
  return form;
}

function reportProgress(
  loaded: number,
  total: number | undefined,
  onProgress: UploadImageOptions['onProgress'],
) {
  if (!onProgress || !total) return;
  onProgress(Math.min(100, Math.round((loaded / total) * 100)));
}
