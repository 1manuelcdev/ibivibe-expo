import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: mocks,
}));

import { reviewsApi } from '@/features/reviews/reviews-api';

describe('reviews API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.get.mockResolvedValue({ data: [] });
    mocks.patch.mockResolvedValue({ data: { id: 'review-1' } });
    mocks.post.mockResolvedValue({ data: { id: 'review-1' } });
  });

  it('lists reviews with the matching entity query parameter', async () => {
    await reviewsApi.list('business', 'business-1');
    await reviewsApi.list('event', 'event-1');

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/reviews', {
      params: { businessId: 'business-1' },
    });
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/reviews', { params: { eventId: 'event-1' } });
  });

  it('creates and edits reviews with the documented payloads', async () => {
    await reviewsApi.create({
      business_id: 'business-1',
      comment: 'Experiência excelente.',
      rating: 5,
    });
    await reviewsApi.update('review-1', { comment: 'Experiência ainda melhor.', rating: 4 });

    expect(mocks.post).toHaveBeenCalledWith('/reviews', {
      business_id: 'business-1',
      comment: 'Experiência excelente.',
      rating: 5,
    });
    expect(mocks.patch).toHaveBeenCalledWith('/reviews/review-1', {
      comment: 'Experiência ainda melhor.',
      rating: 4,
    });
  });
});
