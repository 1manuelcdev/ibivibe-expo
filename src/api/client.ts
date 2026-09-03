import axios, { AxiosError } from 'axios';

import { tokenStorage } from '@/storage/token-storage';

const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';

let refreshPromise: Promise<string | null> | null = null;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

apiClient.interceptors.request.use(async (config) => {
  const { accessToken } = await tokenStorage.get();

  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const requestUrl = config?.url ?? '';
    const shouldSkipRefresh =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/google') ||
      requestUrl.includes('/auth/refresh');

    if (error.response?.status !== 401 || !config || config._retry || shouldSkipRefresh) {
      return Promise.reject(error);
    }

    config._retry = true;

    if (!refreshPromise) {
      refreshPromise = refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
    }

    const accessToken = await refreshPromise;

    if (!accessToken) return Promise.reject(error);

    config.headers.Authorization = `Bearer ${accessToken}`;
    return apiClient(config);
  },
);

async function refreshAccessToken() {
  const { refreshToken } = await tokenStorage.get();

  if (!refreshToken) return null;

  try {
    const { data } = await axios.post<{
      access_token: string;
      refresh_token: string;
    }>(`${apiBaseUrl}/auth/refresh`, null, {
      headers: { 'x-refresh-token': refreshToken },
    });

    await tokenStorage.set(data.access_token, data.refresh_token);
    return data.access_token;
  } catch {
    await tokenStorage.clear();
    return null;
  }
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const responseMessage = error.response?.data?.message;

    if (Array.isArray(responseMessage)) return responseMessage.join(', ');
    if (typeof responseMessage === 'string') return responseMessage;
  }

  return 'Não foi possível concluir a operação.';
}
