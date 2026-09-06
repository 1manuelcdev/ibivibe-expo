import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: mocks,
}));

import { favoritesApi } from '@/features/favorites/favorites-api';

describe('favorites API', () => {
  it('lists favorites scoped to the active account', async () => {
    const favorites = [{ account_id: 'account-1', city_id: 'city-1', id: 'favorite-1' }];
    mocks.get.mockResolvedValue({ data: favorites });

    await expect(favoritesApi.list('account-1')).resolves.toEqual(favorites);

    expect(mocks.get).toHaveBeenCalledWith('/favorites', { params: { account_id: 'account-1' } });
  });

  it('creates and removes favorites using their API identifiers', async () => {
    const input = { account_id: 'account-1', event_id: 'event-1' };
    const favorite = { ...input, id: 'favorite-1' };
    mocks.post.mockResolvedValue({ data: favorite });

    await expect(favoritesApi.add(input)).resolves.toEqual(favorite);
    await favoritesApi.remove(favorite.id);

    expect(mocks.post).toHaveBeenCalledWith('/favorites', input);
    expect(mocks.delete).toHaveBeenCalledWith('/favorites/favorite-1');
  });
});
