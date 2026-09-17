import { create } from 'zustand';

import { authApi } from '@/features/auth/auth-api';
import {
  accountSessionStorage,
  type StoredAccountSession,
} from '@/storage/account-session-storage';
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
  sessions: StoredAccountSession[];
  restoreSession: () => Promise<void>;
  activateAccount: (accountId: string) => Promise<void>;
  removeAccount: (accountId: string) => Promise<void>;
  login: (input: LoginInput) => Promise<void>;
  register: (input: RegisterInput) => Promise<void>;
  setAuthResponse: (response: AuthResponse) => Promise<void>;
  completeEmailVerification: () => Promise<void>;
  completeOnboarding: (account: Account) => Promise<void>;
  updateAccount: (account: Account) => void;
  logout: () => Promise<void>;
};

type SessionCandidate = {
  accountId: string | null;
  refreshToken: string | null;
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
  sessions: [],

  restoreSession: async () => {
    const sessions = await accountSessionStorage.list();
    const activeAccountId = await accountSessionStorage.getActiveAccountId();
    const { refreshToken: legacyRefreshToken } = await tokenStorage.get();
    const orderedSessions = activeAccountId
      ? [
          ...sessions.filter((session) => session.account.id === activeAccountId),
          ...sessions.filter((session) => session.account.id !== activeAccountId),
        ]
      : sessions;
    const candidates: SessionCandidate[] = orderedSessions.map((session) => ({
      accountId: session.account.id,
      refreshToken: null,
    }));

    if (!candidates.length && legacyRefreshToken) {
      candidates.push({ accountId: null, refreshToken: legacyRefreshToken });
    }

    for (const candidate of candidates) {
      const refreshToken =
        candidate.refreshToken ??
        (candidate.accountId
          ? await accountSessionStorage.getRefreshToken(candidate.accountId)
          : null);
      if (!refreshToken) continue;

      try {
        await tokenStorage.set(null, refreshToken);
        const account = await authApi.getMe();
        const { refreshToken: renewedRefreshToken } = await tokenStorage.get();
        const nextSessions = await accountSessionStorage.save(
          account,
          renewedRefreshToken ?? refreshToken,
        );
        const hasPendingOnboarding =
          (await onboardingStorage.getCompletionState(account.id)) === false;
        set({ account, sessions: nextSessions, status: getStatus(account, hasPendingOnboarding) });
        return;
      } catch {
        if (candidate.accountId) await accountSessionStorage.remove(candidate.accountId);
      }
    }

    await tokenStorage.clear();
    set({ status: 'anonymous', account: null, sessions: await accountSessionStorage.list() });
  },

  activateAccount: async (accountId) => {
    const currentTokens = await tokenStorage.get();
    const refreshToken = await accountSessionStorage.getRefreshToken(accountId);
    if (!refreshToken)
      throw new Error('A sessão desta conta não está disponível neste dispositivo.');

    try {
      await tokenStorage.set(null, refreshToken);
      const account = await authApi.getMe();
      const { refreshToken: renewedRefreshToken } = await tokenStorage.get();
      const sessions = await accountSessionStorage.save(
        account,
        renewedRefreshToken ?? refreshToken,
      );
      const hasPendingOnboarding =
        (await onboardingStorage.getCompletionState(account.id)) === false;
      set({ account, sessions, status: getStatus(account, hasPendingOnboarding) });
    } catch (error) {
      if (currentTokens.refreshToken) {
        await tokenStorage.set(currentTokens.accessToken, currentTokens.refreshToken);
      } else {
        await tokenStorage.clear();
      }
      throw error;
    }
  },

  removeAccount: async (accountId) => {
    const isActive = useSessionStore.getState().account?.id === accountId;
    const sessions = await accountSessionStorage.remove(accountId);

    if (isActive) {
      await tokenStorage.clear();
      set({ account: null, sessions, status: 'boot' });
      await useSessionStore.getState().restoreSession();
      return;
    }

    set({ sessions });
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
    const sessions = await accountSessionStorage.save(response.account, response.refresh_token);
    await tokenStorage.set(response.access_token, response.refresh_token);
    set({ status: getStatus(response.account), account: response.account, sessions });
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
    set((state) =>
      state.account?.id === account.id
        ? {
            account,
            sessions: state.sessions.map((session) =>
              session.account.id === account.id ? { ...session, account } : session,
            ),
          }
        : state,
    );
  },

  logout: async () => {
    const accountId = useSessionStore.getState().account?.id;
    if (!accountId) {
      await tokenStorage.clear();
      set({ status: 'anonymous', account: null, sessions: [] });
      return;
    }
    await useSessionStore.getState().removeAccount(accountId);
  },
}));
