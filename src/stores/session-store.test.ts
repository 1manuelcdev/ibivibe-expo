import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Account } from '@/types/auth';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  get: vi.fn(),
  getMe: vi.fn(),
  set: vi.fn(),
}));

vi.mock('@/storage/token-storage', () => ({
  tokenStorage: {
    clear: mocks.clear,
    get: mocks.get,
    set: mocks.set,
  },
}));

vi.mock('@/features/auth/auth-api', () => ({
  authApi: {
    getMe: mocks.getMe,
    login: vi.fn(),
    register: vi.fn(),
  },
}));

import { useSessionStore } from '@/stores/session-store';

const verifiedAccount: Account = {
  email: 'ana@ibivibe.com.br',
  id: 'account-1',
  is_verified: true,
};

describe('session store', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSessionStore.setState({ account: null, status: 'boot' });
  });

  it('keeps the session anonymous when secure tokens are unavailable', async () => {
    mocks.get.mockResolvedValue({ accessToken: null, refreshToken: null });

    await useSessionStore.getState().restoreSession();

    expect(mocks.getMe).not.toHaveBeenCalled();
    expect(useSessionStore.getState()).toMatchObject({ account: null, status: 'anonymous' });
  });

  it('requires verification for an unverified account restored from the API', async () => {
    mocks.get.mockResolvedValue({ accessToken: 'access', refreshToken: 'refresh' });
    mocks.getMe.mockResolvedValue({ ...verifiedAccount, is_verified: false });

    await useSessionStore.getState().restoreSession();

    expect(useSessionStore.getState()).toMatchObject({
      account: { id: verifiedAccount.id },
      status: 'needs-verification',
    });
  });

  it('persists new tokens and scopes onboarding status to the returned account', async () => {
    const account = { ...verifiedAccount, needs_onboarding: true };

    await useSessionStore.getState().setAuthResponse({
      access_token: 'new-access',
      account,
      refresh_token: 'new-refresh',
    });

    expect(mocks.set).toHaveBeenCalledWith('new-access', 'new-refresh');
    expect(useSessionStore.getState()).toMatchObject({
      account,
      status: 'needs-onboarding',
    });
  });
});
