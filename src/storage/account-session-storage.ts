import * as SecureStore from 'expo-secure-store';

import type { Account } from '@/types/auth';

const ACTIVE_ACCOUNT_ID_KEY = 'ibivibe.active-account-id';
const SESSIONS_KEY = 'ibivibe.account-sessions';
const refreshTokenKey = (accountId: string) => `ibivibe.account-session.${accountId}.refresh-token`;

export type StoredAccountSession = {
  account: Account;
  lastUsedAt: string;
};

function parseSessions(value: string | null): StoredAccountSession[] {
  if (!value) return [];

  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as StoredAccountSession[]) : [];
  } catch {
    return [];
  }
}

async function setSessions(sessions: StoredAccountSession[]) {
  await SecureStore.setItemAsync(SESSIONS_KEY, JSON.stringify(sessions));
}

export const accountSessionStorage = {
  async getActiveAccountId() {
    return SecureStore.getItemAsync(ACTIVE_ACCOUNT_ID_KEY);
  },

  async getRefreshToken(accountId: string) {
    return SecureStore.getItemAsync(refreshTokenKey(accountId));
  },

  async list(): Promise<StoredAccountSession[]> {
    const sessions = parseSessions(await SecureStore.getItemAsync(SESSIONS_KEY));
    return sessions.sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt));
  },

  async save(account: Account, refreshToken: string) {
    const sessions = await this.list();
    const nextSession: StoredAccountSession = { account, lastUsedAt: new Date().toISOString() };
    const nextSessions = [
      nextSession,
      ...sessions.filter((session) => session.account.id !== account.id),
    ];

    await Promise.all([
      setSessions(nextSessions),
      SecureStore.setItemAsync(ACTIVE_ACCOUNT_ID_KEY, account.id),
      SecureStore.setItemAsync(refreshTokenKey(account.id), refreshToken),
    ]);

    return nextSessions;
  },

  async updateRefreshToken(accountId: string, refreshToken: string) {
    await SecureStore.setItemAsync(refreshTokenKey(accountId), refreshToken);
  },

  async remove(accountId: string) {
    const [sessions, activeAccountId] = await Promise.all([this.list(), this.getActiveAccountId()]);
    const nextSessions = sessions.filter((session) => session.account.id !== accountId);
    const writes: Promise<void>[] = [
      setSessions(nextSessions),
      SecureStore.deleteItemAsync(refreshTokenKey(accountId)),
    ];

    if (activeAccountId === accountId)
      writes.push(SecureStore.deleteItemAsync(ACTIVE_ACCOUNT_ID_KEY));
    await Promise.all(writes);
    return nextSessions;
  },
};
