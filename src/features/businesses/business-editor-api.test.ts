import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  put: vi.fn(),
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
});
