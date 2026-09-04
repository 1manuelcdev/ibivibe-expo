import { create } from 'zustand';

import { authApi } from '@/features/auth/auth-api';
import { onboardingStorage } from '@/storage/onboarding-storage';
import { tokenStorage } from '@/storage/token-storage';
import type { Account, AuthResponse, LoginInput, RegisterInput } from '@/types/auth';

export type SessionStatus =
  | 'boot'
  | 'anonymous'
  | 'authenticated'
  | 'needs-verification'
  | 'needs-onboarding';

type SessionState = {
  status: SessionStatus;
  account: Account | null;
  restoreSession: () => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  setAuthResponse: (response: AuthResponse) => Promise<void>;
  completeEmailVerification: () => Promise<void>;
  completeOnboarding: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => void;
  logout: () => Promise<void>;
};

function getStatus(account: Account, hasPendingOnboarding = false): SessionStatus {
  const isVerified = account.is_verified ?? account.email_verified ?? false;

  if (!isVerified) return 'needs-verification';
  if (account.needs_onboarding === true || hasPendingOnboarding) return 'needs-onboarding';
  return 'authenticated';
}

export const useSessionStore = create<SessionState>((set) => ({
  status: 'boot',
  account: null,

  restoreSession: async () => {
    const { accessToken, refreshToken } = await tokenStorage.get();

    if (!accessToken || !refreshToken) {
      set({ status: 'anonymous', account: null });
      return;
    }

    try {
      const account = await authApi.getMe();
      const hasPendingOnboarding = (await onboardingStorage.getCompletionState(account.id)) === false;
      set({ status: getStatus(account, hasPendingOnboarding), account });
    } catch {
      await tokenStorage.clear();
      set({ status: 'anonymous', account: null });
    }
  },

  login: async (input) => {
    const response = await authApi.login(input);
    await useSessionStore.getState().setAuthResponse(response);
  },

  register: async (input) => {
    const response = await authApi.register(input);
    await onboardingStorage.markPending(response.account.id);
    await useSessionStore
      .getState()
      .setAuthResponse({ ...response, account: { ...response.account, needs_onboarding: true } });
  },

  setAuthResponse: async (response) => {
    await tokenStorage.set(response.access_token, response.refresh_token);
    set({ status: getStatus(response.account), account: response.account });
  },

  completeEmailVerification: async () => {
    const account = useSessionStore.getState().account;

    if (!account) return;

    const verifiedAccount = { ...account, email_verified: true, is_verified: true };
    const hasPendingOnboarding = (await onboardingStorage.getCompletionState(account.id)) === false;
    set({ account: verifiedAccount, status: getStatus(verifiedAccount, hasPendingOnboarding) });
  },

  completeOnboarding: async (account) => {
    await onboardingStorage.markCompleted(account.id);
    set({ account: { ...account, needs_onboarding: false }, status: 'authenticated' });
  },

  updateAccount: (account) => {
    set((state) => (state.account?.id === account.id ? { account } : state));
  },

  logout: async () => {
    await tokenStorage.clear();
    set({ status: 'anonymous', account: null });
  },
}));
