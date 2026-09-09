import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}));

vi.mock('@/api/client', () => ({ apiClient: mocks }));

import { businessEditorApi } from '@/features/businesses/business-editor-api';

describe('business editor API', () => {
  it('loads the business owned by the current account with its public profile and tags', async () => {
    mocks.get
      .mockResolvedValueOnce({
        data: [
          { account_id: 'other', id: 'other-business' },
          { account_id: 'account-1', id: 'business-1' },
        ],
      })
      .mockResolvedValueOnce({ data: { id: 'business-1' } })
      .mockResolvedValueOnce({ data: [{ id: 'tag-1', name: 'Restaurantes' }] });

    await expect(businessEditorApi.getEditorData('account-1')).resolves.toMatchObject({
      business: { id: 'business-1' },
      profile: { id: 'business-1' },
      tags: [{ id: 'tag-1' }],
    });

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/businesses');
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/businesses/business-1/public-profile');
    expect(mocks.get).toHaveBeenNthCalledWith(3, '/tags');
  });

  it('uses the profile, contact and tag endpoints to persist edits', async () => {
    mocks.patch.mockResolvedValue({ data: {} });
    mocks.put.mockResolvedValue({ data: {} });

    await businessEditorApi.updateProfile('business-1', { commercial_name: 'Casa da Serra' });
    await businessEditorApi.updateContact('business-1', { whatsapp: '+5588999999999' });
    await businessEditorApi.updateTags('business-1', ['tag-1', 'tag-2']);

    expect(mocks.patch).toHaveBeenNthCalledWith(1, '/businesses/business-1/profile', {
      commercial_name: 'Casa da Serra',
    });
    expect(mocks.patch).toHaveBeenNthCalledWith(2, '/businesses/business-1/contact', {
      whatsapp: '+5588999999999',
    });
    expect(mocks.put).toHaveBeenCalledWith('/businesses/business-1/tags', {
      tag_ids: ['tag-1', 'tag-2'],
    });
  });

  it('sends a selected profile image as multipart data', async () => {
    mocks.post.mockResolvedValue({
      data: { profile_photo_url: 'https://cdn.example.com/profile.jpg' },
    });

    await businessEditorApi.uploadProfilePhoto('business-1', {
      fileName: 'perfil.jpg',
      mimeType: 'image/jpeg',
      uri: 'file:///perfil.jpg',
    });

    expect(mocks.post).toHaveBeenCalledWith(
      '/businesses/business-1/profile-photo',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    );
  });

  it('reports multipart upload progress when the platform provides totals', async () => {
    const onProgress = vi.fn();
    mocks.post.mockResolvedValue({ data: {} });

    await businessEditorApi.uploadProfilePhoto(
      'business-1',
      { fileName: 'perfil.webp', mimeType: 'image/webp', uri: 'file:///perfil.webp' },
      { onProgress },
    );

    const config = mocks.post.mock.calls.at(-1)?.[2] as {
      onUploadProgress: (event: { loaded: number; total?: number }) => void;
    };
    config.onUploadProgress({ loaded: 3, total: 4 });
    config.onUploadProgress({ loaded: 4 });

    expect(onProgress).toHaveBeenCalledTimes(1);
    expect(onProgress).toHaveBeenCalledWith(75);
  });

  it('uses the gallery media endpoints to load, upload, order and remove photos', async () => {
    mocks.get.mockResolvedValue({
      data: [{ id: 'media-1', url: 'https://cdn.example.com/1.jpg' }],
    });
    mocks.post.mockResolvedValue({ data: { id: 'media-2' } });
    mocks.patch.mockResolvedValue({ data: {} });
    mocks.delete.mockResolvedValue({ data: {} });

    await expect(businessEditorApi.getMedia('business-1')).resolves.toEqual([
      { id: 'media-1', url: 'https://cdn.example.com/1.jpg' },
    ]);
    await businessEditorApi.uploadMedia('business-1', {
      fileName: 'fachada.jpg',
      mimeType: 'image/jpeg',
      uri: 'file:///fachada.jpg',
    });
    await businessEditorApi.reorderMedia('business-1', ['media-2', 'media-1']);
    await businessEditorApi.deleteMedia('business-1', 'media-1');

    expect(mocks.get).toHaveBeenLastCalledWith('/businesses/business-1/media');
    expect(mocks.post).toHaveBeenLastCalledWith(
      '/businesses/business-1/media',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    );
    expect(mocks.patch).toHaveBeenLastCalledWith('/businesses/business-1/media/order', {
      media_ids: ['media-2', 'media-1'],
    });
    expect(mocks.delete).toHaveBeenCalledWith('/businesses/business-1/media/media-1');
  });
});
