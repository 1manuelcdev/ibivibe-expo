import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  delete: vi.fn(),
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/api/client', () => ({ apiClient: mocks }));

import { eventApi } from '@/features/events/event-api';

describe('event API', () => {
  it('creates events without trusting the owner account from the client', async () => {
    mocks.post.mockResolvedValue({ data: { id: 'event-1' } });

    await eventApi.create({
      active: true,
      city_ids: ['city-1'],
      description: 'Festival de Inverno',
      end_date: '2026-10-07T23:00:00.000Z',
      name: 'Festival de Inverno',
      reach_level: 'local',
      start_date: '2026-10-07T18:00:00.000Z',
      status: 'published',
      tag_ids: ['tag-1'],
      type: 'simple',
    });

    expect(mocks.post).toHaveBeenCalledWith(
      '/events',
      expect.not.objectContaining({ owner_account_id: expect.anything() }),
    );
  });

  it('uses the owned events endpoint and event media endpoints', async () => {
    mocks.get.mockResolvedValue({ data: [] });
    mocks.patch.mockResolvedValue({ data: {} });
    mocks.delete.mockResolvedValue({ data: {} });

    await eventApi.getOwned();
    await eventApi.reorderMedia('event-1', ['media-2', 'media-1']);
    await eventApi.deleteMedia('event-1', 'media-1');

    expect(mocks.get).toHaveBeenCalledWith('/events/owned');
    expect(mocks.patch).toHaveBeenCalledWith('/events/event-1/media/order', {
      media_ids: ['media-2', 'media-1'],
    });
    expect(mocks.delete).toHaveBeenCalledWith('/events/event-1/media/media-1');
  });
});
