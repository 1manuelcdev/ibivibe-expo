import { describe, expect, it, vi } from 'vitest';

const get = vi.hoisted(() => vi.fn());

vi.mock('@/api/client', () => ({
  apiClient: { get },
}));

import { homeApi } from '@/features/home/home-api';

describe('home API', () => {
  it.each([
    ['events', '/events', homeApi.getEvents],
    ['businesses', '/businesses', homeApi.getBusinesses],
    ['cities', '/cities', homeApi.getCities],
  ])('loads %s from %s', async (_resource, endpoint, request) => {
    const data = [{ id: endpoint }];
    get.mockResolvedValueOnce({ data });

    await expect(request()).resolves.toEqual(data);
    expect(get).toHaveBeenCalledWith(endpoint);
  });
});
