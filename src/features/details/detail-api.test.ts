import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: mocks,
}));

import { detailApi } from '@/features/details/detail-api';

describe('detail API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({ data: {} });
  });

  it('loads a business and its media from the active API contracts', async () => {
    await detailApi.business('business-1');
    await detailApi.businessMedia('business-1');

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/businesses/business-1');
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/businesses/business-1/media');
  });
});
