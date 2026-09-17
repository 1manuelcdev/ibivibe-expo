import * as SecureStore from 'expo-secure-store';

const REFRESH_TOKEN_KEY = 'ibivibe.refresh-token';

let accessToken: string | null = null;

export const tokenStorage = {
  async get() {
    return { accessToken, refreshToken: await SecureStore.getItemAsync(REFRESH_TOKEN_KEY) };
  },

  async set(nextAccessToken: string | null, refreshToken: string) {
    accessToken = nextAccessToken;
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clear() {
    accessToken = null;
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
};
