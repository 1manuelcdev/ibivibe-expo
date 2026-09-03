import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { getApiErrorMessage } from '@/api/client';
import { registerSchema, type RegisterFormValues } from '@/features/auth/models/auth-schemas';
import { useSessionStore } from '@/stores/session-store';

export function useRegisterViewModel() {
  const router = useRouter();
  const register = useSessionStore((state) => state.register);
  const [error, setError] = useState<string | null>(null);
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      display_name: '',
      slug: '',
      email: '',
      password: '',
      password_confirm: '',
      type: 'personal',
    },
  });

  const submit = form.handleSubmit(async (values) => {
    setError(null);

    try {
      await register(values);
      router.replace('/');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    }
  });

  return { ...form, error, dismissError: () => setError(null), submit };
}
