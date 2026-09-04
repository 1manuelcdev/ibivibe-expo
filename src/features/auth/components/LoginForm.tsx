import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { useLoginViewModel } from '@/features/auth/viewmodels/useLoginViewModel';
import { colors, radius, spacing } from '@/theme/tokens';

type LoginFormProps = { initialEmail?: string };

export function LoginForm({ initialEmail = '' }: LoginFormProps) {
  const router = useRouter();
  const { control, error, formState, submit } = useLoginViewModel(initialEmail);
  const passwordInput = useRef<TextInput>(null);

  useEffect(() => {
    if (error) Alert.alert('Não foi possível entrar', error);
  }, [error]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" hitSlop={12} onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>Bem vindo(a) de volta!</Text>
          <Text style={styles.title}>Entrar</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputs}>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  error={fieldState.error?.message}
                  inputStyle={styles.input}
                  keyboardType="email-address"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={() => passwordInput.current?.focus()}
                  placeholder="Email"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  value={value}
                />
              )}
            />
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="password"
                  error={fieldState.error?.message}
                  inputStyle={styles.input}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  onSubmitEditing={submit}
                  placeholder="Senha"
                  ref={passwordInput}
                  returnKeyType="done"
                  secureTextEntry
                  value={value}
                />
              )}
            />
            <Pressable onPress={() => router.push('/(auth)/forgot-password')} style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordLabel}>Esqueci minha senha</Text>
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
          <Pressable onPress={() => router.push('/(auth)/register')} style={styles.registerButton}>
            <Text style={styles.registerLabel}>Ainda não tenho conta</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = {
  container: { flex: 1, paddingHorizontal: spacing.screen, paddingTop: 16 },
  header: { height: 40, justifyContent: 'center' as const },
  backButton: { alignItems: 'center' as const, height: 40, justifyContent: 'center' as const, width: 40 },
  main: { gap: 24, paddingTop: 24 },
  heading: { gap: 8 },
  eyebrow: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 24, lineHeight: 30 },
  form: { gap: 24 },
  inputs: { gap: 12 },
  input: { height: 40 },
  forgotPassword: { alignSelf: 'flex-start' as const, height: 32, justifyContent: 'center' as const, paddingHorizontal: 8 },
  forgotPasswordLabel: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
  },
  submit: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 48,
    justifyContent: 'center' as const,
  },
  submitLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  registerButton: { alignItems: 'center' as const, height: 32, justifyContent: 'center' as const, paddingHorizontal: 8 },
  registerLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  pressed: { opacity: 0.75 },
} as const;
