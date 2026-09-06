import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
}));

vi.mock('@/api/client', () => ({
  apiClient: mocks,
}));

import { authApi } from '@/features/auth/auth-api';

describe('auth API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('sends login credentials and returns the authenticated session', async () => {
    const input = { email: 'ana@ibivibe.com.br', password: 'password123' };
    const response = {
      data: { access_token: 'access', account: { id: 'account-1' }, refresh_token: 'refresh' },
    };
    mocks.post.mockResolvedValue(response);

    await expect(authApi.login(input)).resolves.toEqual(response.data);

    expect(mocks.post).toHaveBeenCalledWith('/auth/login', input);
  });

  it('sends the full registration payload unchanged', async () => {
    const input = {
      display_name: 'Ana',
      email: 'ana@ibivibe.com.br',
      name: 'Ana da Silva',
      password: 'password123',
      password_confirm: 'password123',
      slug: 'ana-da-silva',
      type: 'personal',
    };
    mocks.post.mockResolvedValue({ data: { account: { id: 'account-1' } } });

    await authApi.register(input);

    expect(mocks.post).toHaveBeenCalledWith('/auth/register', input);
  });

  it('loads the current account and supports verification recovery actions', async () => {
    mocks.get.mockResolvedValue({ data: { id: 'account-1' } });
    mocks.post.mockResolvedValue({ data: undefined });

    await expect(authApi.getMe()).resolves.toEqual({ id: 'account-1' });
    await authApi.verifyEmail('  verification-token  ');
    await authApi.resendVerificationEmail();
    await authApi.changeUnverifiedEmail('  new@ibivibe.com.br  ');

    expect(mocks.get).toHaveBeenNthCalledWith(1, '/auth/me');
    expect(mocks.get).toHaveBeenNthCalledWith(2, '/auth/verify-email', {
      params: { token: 'verification-token' },
    });
    expect(mocks.post).toHaveBeenNthCalledWith(1, '/auth/resend-verification');
    expect(mocks.post).toHaveBeenNthCalledWith(2, '/auth/change-unverified-email', {
      email: 'new@ibivibe.com.br',
    });
  });
});
