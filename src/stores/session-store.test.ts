import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { Account } from '@/types/auth';

const mocks = vi.hoisted(() => ({
  clear: vi.fn(),
  getCompletionState: vi.fn(),
  get: vi.fn(),
  getMe: vi.fn(),
  login: vi.fn(),
  markCompleted: vi.fn(),
  markPending: vi.fn(),
  register: vi.fn(),
  set: vi.fn(),
}));

vi.mock('@/storage/onboarding-storage', () => ({
  onboardingStorage: {
    getCompletionState: mocks.getCompletionState,
    markCompleted: mocks.markCompleted,
    markPending: mocks.markPending,
  },
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
    login: mocks.login,
    register: mocks.register,
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
    mocks.getCompletionState.mockResolvedValue(null);
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

  it('marks a newly registered account as pending before it can reach the home screen', async () => {
    mocks.register.mockResolvedValue({
      access_token: 'new-access',
      account: verifiedAccount,
      refresh_token: 'new-refresh',
    });

    await useSessionStore.getState().register({
      display_name: 'Ana',
      email: verifiedAccount.email,
      name: 'Ana da Silva',
      password: 'password123',
      password_confirm: 'password123',
      slug: 'ana-da-silva',
    });

    expect(mocks.markPending).toHaveBeenCalledWith(verifiedAccount.id);
    expect(useSessionStore.getState().status).toBe('needs-onboarding');
  });

  it('marks onboarding complete only for the active account', async () => {
    useSessionStore.setState({ account: verifiedAccount, status: 'needs-onboarding' });

    await useSessionStore.getState().completeOnboarding(verifiedAccount);

    expect(mocks.markCompleted).toHaveBeenCalledWith(verifiedAccount.id);
    expect(useSessionStore.getState()).toMatchObject({
      account: { id: verifiedAccount.id, needs_onboarding: false },
      status: 'authenticated',
    });
  });

  it('continues to onboarding after email verification for a newly registered account', async () => {
    useSessionStore.setState({
      account: { ...verifiedAccount, is_verified: false, needs_onboarding: true },
      status: 'needs-verification',
    });
    mocks.getCompletionState.mockResolvedValue(false);

    await useSessionStore.getState().completeEmailVerification();

    expect(useSessionStore.getState()).toMatchObject({
      account: { id: verifiedAccount.id, is_verified: true },
      status: 'needs-onboarding',
    });
  });
});
