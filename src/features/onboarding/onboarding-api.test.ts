import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: mocks,
}));

import { onboardingApi } from '@/features/onboarding/onboarding-api';

describe('onboarding API', () => {
  it('loads the public resources needed by the forms', async () => {
    mocks.get.mockResolvedValue({ data: [] });

    await onboardingApi.getTagGroups();
    await onboardingApi.getTags();
    await onboardingApi.getCities();

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/tags/groups');
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/tags');
    expect(mocks.get).toHaveBeenNthCalledWith(3, '/cities');
  });

  it('persists interests scoped to the active account', async () => {
    const interests = { businesses: ['business-tag'], events: ['event-tag'] };
    mocks.patch.mockResolvedValue({ data: { count: 2 } });

    await expect(onboardingApi.saveInterests('account-1', interests)).resolves.toEqual({ count: 2 });

    expect(mocks.patch).toHaveBeenCalledWith('/accounts/account-1/interests', interests);
  });

  it('submits the business onboarding payload expected by the backend', async () => {
    const input = {
      branch_city_ids: ['branch-city'],
      cnpj: '12345678000195',
      headquarters_city_id: 'headquarters-city',
      name: 'IbiVibe Turismo',
    };
    mocks.post.mockResolvedValue({ data: { id: 'business-1' } });

    await expect(onboardingApi.createBusiness(input)).resolves.toEqual({ id: 'business-1' });

    expect(mocks.post).toHaveBeenCalledWith('/businesses/onboarding', input);
  });
});
