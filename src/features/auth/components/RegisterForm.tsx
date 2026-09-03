import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { RegisterFormValues } from '@/features/auth/models/auth-schemas';
import { useRegisterViewModel } from '@/features/auth/viewmodels/useRegisterViewModel';
import { colors, radius, spacing } from '@/theme/tokens';

type Values = RegisterFormValues;

export function RegisterForm() {
  const router = useRouter();
  const { control, error, formState, submit } = useRegisterViewModel();

  useEffect(() => {
    if (error) Alert.alert('Não foi possível criar sua conta', error);
  }, [error]);

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.eyebrow}>IbiVibe</Text>
        <Text style={styles.title}>Crie sua conta</Text>
        <Text style={styles.subtitle}>Entre para descobrir empresas e eventos da Ibiapaba.</Text>
      </View>

      <View style={styles.fields}>
        <FormField control={control} name="name" label="Nome completo" placeholder="Seu nome" />
        <FormField
          control={control}
          name="display_name"
          label="Nome de exibição"
          placeholder="Como você quer aparecer?"
        />
        <FormField
          control={control}
          name="slug"
          label="Identificador"
          placeholder="seu-identificador"
          autoCapitalize="none"
        />
        <FormField
          control={control}
          name="email"
          label="E-mail"
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        <FormField
          control={control}
          name="password"
          label="Senha"
          placeholder="Mínimo de 8 caracteres"
          secureTextEntry
          autoCapitalize="none"
        />
        <FormField
          control={control}
          name="password_confirm"
          label="Confirmar senha"
          placeholder="Repita sua senha"
          secureTextEntry
          autoCapitalize="none"
        />
        <View style={styles.typeGroup}>
          <Text style={styles.label}>Tipo de perfil</Text>
          <View style={styles.typeOptions}>
            <TypeOption control={control} value="personal" label="Pessoal" />
            <TypeOption control={control} value="business" label="Empresa" />
          </View>
        </View>
      </View>

      <Pressable
        disabled={formState.isSubmitting}
        onPress={submit}
        style={({ pressed }) => [
          styles.submit,
          (pressed || formState.isSubmitting) && styles.pressed,
        ]}
      >
        <Text style={styles.submitLabel}>
          {formState.isSubmitting ? 'Criando...' : 'Criar conta'}
        </Text>
      </Pressable>
      <View style={styles.loginRow}>
        <Text style={styles.loginText}>Já tem uma conta?</Text>
        <Pressable onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.loginLink}>Entrar</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

type FieldProps = { control: Control<Values>; label: string; name: keyof Values } & Omit<
  React.ComponentProps<typeof TextInput>,
  'value'
>;

function FormField({ control, label, name, ...inputProps }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>{label}</Text>
          <TextInput
            {...inputProps}
            onBlur={field.onBlur}
            onChangeText={field.onChange}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, fieldState.error && styles.inputError]}
            value={typeof field.value === 'string' ? field.value : ''}
          />
          {fieldState.error?.message ? (
            <Text style={styles.error}>{fieldState.error.message}</Text>
          ) : null}
        </View>
      )}
    />
  );
}

function TypeOption({
  control,
  label,
  value,
}: {
  control: Control<Values>;
  label: string;
  value: Values['type'];
}) {
  return (
    <Controller
      control={control}
      name="type"
      render={({ field }) => {
        const selected = field.value === value;
        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            onPress={() => field.onChange(value)}
            style={[styles.typeOption, selected && styles.typeOptionSelected]}
          >
            <Text style={[styles.typeLabel, selected && styles.typeLabelSelected]}>{label}</Text>
          </Pressable>
        );
      }}
    />
  );
}

const styles = {
  content: {
    flexGrow: 1,
    gap: spacing.section,
    paddingBottom: 24,
    paddingHorizontal: spacing.screen,
    paddingTop: 32,
  },
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
  typeGroup: { gap: 8 },
  typeOptions: { flexDirection: 'row' as const, gap: 10 },
  typeOption: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    height: 48,
    justifyContent: 'center' as const,
  },
  typeOptionSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeLabel: { color: '#D4D4D8', fontFamily: 'DMSans-Medium', fontSize: 14 },
  typeLabelSelected: { color: colors.primaryForeground },
  submit: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: radius.button,
    height: 48,
    justifyContent: 'center' as const,
  },
  submitLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  loginRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 4,
    justifyContent: 'center' as const,
  },
  loginText: { color: '#D4D4D8', fontFamily: 'DMSans-Regular', fontSize: 14 },
  loginLink: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  pressed: { opacity: 0.75 },
} as const;
