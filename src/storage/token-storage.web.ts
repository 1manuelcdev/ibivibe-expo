const REFRESH_TOKEN_KEY = 'ibivibe.refresh-token';

let accessToken: string | null = null;

export const tokenStorage = {
  async get() {
    return {
      accessToken,
      refreshToken: localStorage.getItem(REFRESH_TOKEN_KEY),
    };
  },

  async set(nextAccessToken: string | null, refreshToken: string) {
    accessToken = nextAccessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  async clear() {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
