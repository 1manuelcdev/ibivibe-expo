import { apiClient } from '@/api/client';
import type { AuthResponse, LoginInput, RegisterInput, Account } from '@/types/auth';

export const authApi = {
  async login(input: LoginInput) {
    const { data } = await apiClient.post<AuthResponse>('/auth/login', input);
    return data;
  },

  async register(input: RegisterInput) {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', input);
    return data;
  },

  async getMe() {
    const { data } = await apiClient.get<Account>('/auth/me');
    return data;
  },

  async verifyEmail(token: string) {
    await apiClient.get('/auth/verify-email', { params: { token: token.trim() } });
  },

  async resendVerificationEmail() {
    await apiClient.post('/auth/resend-verification');
  },

  async changeUnverifiedEmail(email: string) {
    await apiClient.post('/auth/change-unverified-email', { email: email.trim() });
  },
};
