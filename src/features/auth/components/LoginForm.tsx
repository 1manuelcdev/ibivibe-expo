import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Controller } from 'react-hook-form';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { useLoginViewModel } from '@/features/auth/viewmodels/useLoginViewModel';
import { colors } from '@/theme/tokens';

type LoginFormProps = { initialEmail?: string };

export function LoginForm({ initialEmail = '' }: LoginFormProps) {
  const router = useRouter();
  const { control, error, formState, submit } = useLoginViewModel(initialEmail);
  const passwordInput = useRef<TextInput>(null);

  useEffect(() => {
    if (error) Alert.alert('Não foi possível entrar', error);
  }, [error]);

  return (
    <View className="flex-1 px-6 pt-4">
      <View className="h-10 justify-center">
        <Pressable accessibilityLabel="Voltar" className="size-10 items-center justify-center" hitSlop={12} onPress={() => router.back()}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
      </View>

      <View className="gap-6 pt-6">
        <View className="gap-2">
          <Text className="font-dm text-base text-muted-foreground">Bem vindo(a) de volta!</Text>
          <Text className="font-dm-medium text-2xl leading-8 text-foreground">Entrar</Text>
        </View>

        <View className="gap-6">
          <View className="gap-3">
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value }, fieldState }) => (
                <TextField
                  autoCapitalize="none"
                  autoComplete="email"
                  error={fieldState.error?.message}
                  inputStyle={{ height: 40 }}
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
                  inputStyle={{ height: 40 }}
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
            <Pressable className="h-8 self-start justify-center px-2" onPress={() => router.push('/(auth)/forgot-password')}>
              <Text className="font-dm-medium text-sm text-foreground">Esqueci minha senha</Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            disabled={formState.isSubmitting}
            onPress={submit}
            className="h-12 items-center justify-center rounded-button bg-primary active:opacity-75"
          >
            <Text className="font-dm-semibold text-sm text-primary-foreground">{formState.isSubmitting ? 'Entrando...' : 'Entrar'}</Text>
          </Pressable>
          <Pressable className="h-8 items-center justify-center px-2" onPress={() => router.push('/(auth)/register')}>
            <Text className="font-dm-medium text-sm text-foreground">Ainda não tenho conta</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
