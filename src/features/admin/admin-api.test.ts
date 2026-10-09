import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
}));

vi.mock('@/api/client', () => ({ apiClient: mocks }));

import { adminApi } from '@/features/admin/admin-api';

describe('admin API', () => {
  beforeEach(() => vi.clearAllMocks());

  it('loads the protected operational overview', async () => {
    mocks.get.mockResolvedValue({ data: {} });

    await adminApi.getOverview();

    expect(mocks.get).toHaveBeenCalledWith('/admin/overview');
  });

  it('uses the protected city endpoints for data and tags', async () => {
    mocks.get.mockResolvedValue({ data: [] });
    mocks.post.mockResolvedValue({ data: {} });
    mocks.patch.mockResolvedValue({ data: {} });
    mocks.put.mockResolvedValue({ data: {} });

    await adminApi.getCities();
    await adminApi.updateCity('city-1', { latitude: -3.851, longitude: -40.921 });
    await adminApi.updateCityTags('city-1', ['tag-1', 'tag-2']);

    expect(mocks.get).toHaveBeenCalledWith('/admin/resources/cities');
    expect(mocks.patch).toHaveBeenCalledWith('/admin/resources/cities/city-1', {
      latitude: -3.851,
      longitude: -40.921,
    });
    expect(mocks.put).toHaveBeenCalledWith('/admin/resources/cities/city-1/tags', {
      tag_ids: ['tag-1', 'tag-2'],
    });
  });

  it('uses the administrative tag endpoints', async () => {
    mocks.get.mockResolvedValue({ data: [] });
    mocks.patch.mockResolvedValue({ data: {} });
    mocks.delete.mockResolvedValue({ data: {} });

    await adminApi.getTags();
    await adminApi.getTag('tag-1');
    await adminApi.getTagGroups();
    await adminApi.createTag({ group_id: 'group-1', name: 'Turismo rural', target_types: ['city'] });
    await adminApi.updateTag('tag-1', { color: '#9FFF8B', name: 'Turismo rural' });
    await adminApi.deleteTag('tag-1');
    await adminApi.createTagGroup({ name: 'Turismo' });
    await adminApi.updateTagGroup('group-1', { name: 'Natureza' });
    await adminApi.deleteTagGroup('group-1');

    expect(mocks.get).toHaveBeenCalledWith('/admin/resources/tags');
    expect(mocks.get).toHaveBeenCalledWith('/admin/resources/tags/tag-1');
    expect(mocks.get).toHaveBeenCalledWith('/admin/resources/tag-groups');
    expect(mocks.post).toHaveBeenCalledWith('/admin/resources/tags', {
      group_id: 'group-1',
      name: 'Turismo rural',
      target_types: ['city'],
    });
    expect(mocks.patch).toHaveBeenCalledWith('/admin/resources/tags/tag-1', {
      color: '#9FFF8B',
      name: 'Turismo rural',
    });
    expect(mocks.delete).toHaveBeenCalledWith('/admin/resources/tags/tag-1');
    expect(mocks.post).toHaveBeenCalledWith('/admin/resources/tag-groups', { name: 'Turismo' });
    expect(mocks.patch).toHaveBeenCalledWith('/admin/resources/tag-groups/group-1', {
      name: 'Natureza',
    });
    expect(mocks.delete).toHaveBeenCalledWith('/admin/resources/tag-groups/group-1');
  });

  it('uses the city media endpoints for upload, cover, ordering and deletion', async () => {
    mocks.get.mockResolvedValue({ data: [] });
    mocks.post.mockResolvedValue({ data: {} });
    mocks.patch.mockResolvedValue({ data: {} });
    mocks.delete.mockResolvedValue({ data: {} });

    await adminApi.getCityMedia('city-1');
    await adminApi.uploadCityMedia('city-1', {
      fileName: 'serra.webp',
      isCover: true,
      mimeType: 'image/webp',
      position: 0,
      uri: 'file:///serra.webp',
    });
    await adminApi.updateCityMedia('city-1', 'media-1', { is_cover: true });
    await adminApi.reorderCityMedia('city-1', ['media-2', 'media-1']);
    await adminApi.deleteCityMedia('city-1', 'media-1');

    expect(mocks.get).toHaveBeenCalledWith('/admin/resources/cities/city-1/media');
    expect(mocks.post).toHaveBeenCalledWith(
      '/admin/resources/cities/city-1/media',
      expect.any(FormData),
      expect.objectContaining({ headers: { 'Content-Type': 'multipart/form-data' } }),
    );
    expect(mocks.patch).toHaveBeenNthCalledWith(1, '/admin/resources/cities/city-1/media/media-1', {
      is_cover: true,
    });
    expect(mocks.patch).toHaveBeenNthCalledWith(2, '/admin/resources/cities/city-1/media/order', {
      media_ids: ['media-2', 'media-1'],
    });
    expect(mocks.delete).toHaveBeenCalledWith('/admin/resources/cities/city-1/media/media-1');
  });
});
