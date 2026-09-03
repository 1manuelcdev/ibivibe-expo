import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { useLoginViewModel } from '@/features/auth/viewmodels/useLoginViewModel';
import { colors, radius, spacing } from '@/theme/tokens';

type LoginFormProps = { initialEmail?: string };

export function LoginForm({ initialEmail = '' }: LoginFormProps) {
  const router = useRouter();
  const { control, error, formState, submit } = useLoginViewModel(initialEmail);

  useEffect(() => {
    if (error) Alert.alert('Não foi possível entrar', error);
  }, [error]);

  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>IbiVibe</Text>
        <Text style={styles.title}>Boas-vindas de volta</Text>
        <Text style={styles.subtitle}>Entre para descobrir o que acontece na Ibiapaba.</Text>
      </View>

      <View style={styles.fields}>
        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field
              autoCapitalize="none"
              autoComplete="email"
              error={fieldState.error?.message}
              keyboardType="email-address"
              label="E-mail"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="voce@email.com"
              value={value}
            />
          )}
        />
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value }, fieldState }) => (
            <Field
              autoCapitalize="none"
              autoComplete="password"
              error={fieldState.error?.message}
              label="Senha"
              onBlur={onBlur}
              onChangeText={onChange}
              placeholder="Sua senha"
              secureTextEntry
              value={value}
            />
          )}
        />
        <Pressable onPress={() => router.push('/(auth)/forgot-password')}>
          <Text style={styles.forgotPassword}>Esqueci minha senha</Text>
        </Pressable>
      </View>

      <Pressable
        accessibilityRole="button"
        disabled={formState.isSubmitting}
        onPress={submit}
        style={({ pressed }) => [
          styles.submit,
          (pressed || formState.isSubmitting) && styles.pressed,
        ]}
      >
        <Text style={styles.submitLabel}>{formState.isSubmitting ? 'Entrando...' : 'Entrar'}</Text>
      </Pressable>

      <View style={styles.registerRow}>
        <Text style={styles.registerText}>Ainda não tem uma conta?</Text>
        <Pressable onPress={() => router.push('/(auth)/register')}>
          <Text style={styles.registerLink}>Criar conta</Text>
        </Pressable>
      </View>
    </View>
  );
}

type FieldProps = React.ComponentProps<typeof TextInput> & { error?: string; label: string };

function Field({ error, label, ...props }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        placeholderTextColor={colors.mutedForeground}
        style={[styles.input, error && styles.inputError]}
        {...props}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = {
  container: { flex: 1, gap: spacing.section, paddingHorizontal: spacing.screen, paddingTop: 32 },
  heading: { gap: 8 },
  eyebrow: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-Bold', fontSize: 28, lineHeight: 34 },
  subtitle: { color: '#D4D4D8', fontFamily: 'DMSans-Regular', fontSize: 15, lineHeight: 21 },
  fields: { gap: 18 },
  fieldGroup: { gap: 8 },
  label: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  input: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    height: 52,
    paddingHorizontal: spacing.control,
  },
  inputError: { borderColor: '#EF4444' },
  error: { color: '#FCA5A5', fontFamily: 'DMSans-Regular', fontSize: 12 },
  forgotPassword: {
    color: colors.primary,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    textAlign: 'right' as const,
  },
  submit: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 48,
    justifyContent: 'center' as const,
  },
  submitLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  registerRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 4,
    justifyContent: 'center' as const,
  },
  registerText: { color: '#D4D4D8', fontFamily: 'DMSans-Regular', fontSize: 14 },
  registerLink: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  pressed: { opacity: 0.75 },
} as const;
