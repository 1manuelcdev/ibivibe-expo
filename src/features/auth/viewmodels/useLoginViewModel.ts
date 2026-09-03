import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/api/client';
import { loginSchema, type LoginFormValues } from '@/features/auth/models/auth-schemas';
import { useSessionStore } from '@/stores/session-store';

export function useLoginViewModel(initialEmail = '') {
  const router = useRouter();
  const login = useSessionStore((state) => state.login);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: initialEmail, password: '' },
  });

  const submit = form.handleSubmit(async (values) => {
    setError(null);

    try {
      await login(values);
      router.replace('/');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  });

  return { ...form, error, dismissError: () => setError(null), submit };
}
