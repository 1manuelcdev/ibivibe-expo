import { create } from 'zustand';

import { authApi } from '@/features/auth/auth-api';
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
  logout: () => Promise<void>;
};

function getStatus(account: Account): SessionStatus {
  const isVerified = account.is_verified ?? account.email_verified ?? false;

  if (!isVerified) return 'needs-verification';
  if (account.needs_onboarding === true) return 'needs-onboarding';
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
      set({ status: getStatus(account), account });
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
    await useSessionStore.getState().setAuthResponse(response);
  },

  setAuthResponse: async (response) => {
    await tokenStorage.set(response.access_token, response.refresh_token);
    set({ status: getStatus(response.account), account: response.account });
  },

  logout: async () => {
    await tokenStorage.clear();
    set({ status: 'anonymous', account: null });
  },
}));
