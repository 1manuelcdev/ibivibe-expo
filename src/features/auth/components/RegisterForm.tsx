import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import type { RegisterFormValues } from '@/features/auth/models/auth-schemas';
import { useRegisterViewModel } from '@/features/auth/viewmodels/useRegisterViewModel';
import { colors, radius, spacing } from '@/theme/tokens';

type Values = RegisterFormValues;
type Step = 0 | 1 | 2;

export function RegisterForm() {
  const router = useRouter();
  const { control, error, formState, setValue, submit, trigger } = useRegisterViewModel();
  const [step, setStep] = useState<Step>(0);

  useEffect(() => {
    if (error) Alert.alert('Não foi possível criar sua conta', error);
  }, [error]);

  const next = async () => {
    const fields: Record<Exclude<Step, 2>, Array<keyof Values>> = {
      0: ['email', 'password', 'password_confirm'],
      1: ['name', 'display_name', 'slug'],
    };

    if (step === 2) {
      await submit();
      return;
    }

    if (await trigger(fields[step])) setStep((current) => (current + 1) as Step);
  };

  const back = () => {
    if (step === 0) router.back();
    else setStep((current) => (current - 1) as Step);
  };

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" hitSlop={12} onPress={back} style={styles.backButton}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.progress}>Passo {step + 1} de 3</Text>
      </View>

      {step === 0 ? <CredentialsStep control={control} /> : null}
      {step === 1 ? (
        <BasicInfoStep control={control} onNameChange={(name) => setValue('display_name', name)} />
      ) : null}
      {step === 2 ? <AccountTypeStep control={control} /> : null}

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={formState.isSubmitting}
          onPress={() => void next()}
          style={({ pressed }) => [
            styles.submit,
            (pressed || formState.isSubmitting) && styles.pressed,
          ]}
        >
          <Text style={styles.submitLabel}>
            {formState.isSubmitting ? 'Criando conta...' : step === 2 ? 'Criar conta' : 'Continuar'}
          </Text>
        </Pressable>
        {step === 0 ? (
          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Já tem uma conta?</Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text style={styles.loginLink}>Entrar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

function CredentialsStep({ control }: { control: Control<Values> }) {
  return (
    <View style={styles.main}>
      <Heading eyebrow="Olá, vamos criar sua conta" title="Credenciais" />
      <View style={styles.fields}>
        <FormField
          autoCapitalize="none"
          autoComplete="email"
          control={control}
          keyboardType="email-address"
          label="E-mail"
          name="email"
          placeholder="john@doe.com"
        />
        <FormField
          autoCapitalize="none"
          autoComplete="new-password"
          control={control}
          label="Senha"
          name="password"
          placeholder="No mínimo 8 dígitos"
          secureTextEntry
        />
        <FormField
          autoCapitalize="none"
          autoComplete="new-password"
          control={control}
          label="Confirmação da senha"
          name="password_confirm"
          placeholder="A mesma senha acima"
          secureTextEntry
        />
      </View>
    </View>
  );
}

function BasicInfoStep({
  control,
  onNameChange,
}: {
  control: Control<Values>;
  onNameChange: (name: string) => void;
}) {
  return (
    <View style={styles.main}>
      <Heading title="Informações básicas" />
      <View style={styles.fields}>
        <FormField
          autoComplete="name"
          control={control}
          label="Nome"
          name="name"
          onValueChange={onNameChange}
          placeholder="John Doe"
        />
        <FormField
          autoCapitalize="none"
          control={control}
          label="Usuário"
          name="slug"
          placeholder="john-doe"
        />
      </View>
    </View>
  );
}

function AccountTypeStep({ control }: { control: Control<Values> }) {
  return (
    <View style={styles.main}>
      <Heading eyebrow="Como você quer usar sua conta?" title="Tipo de conta" />
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <View style={styles.accountTypes}>
            <AccountTypeCard
              description="Quero descobrir empresas, eventos e explorar a Serrinha"
              icon="compass-outline"
              label="Turista ou morador da Ibiapaba"
              onPress={() => field.onChange('personal')}
              selected={field.value === 'personal'}
            />
            <AccountTypeCard
              description="Quero divulgar minha empresa ou outras empresas e promover eventos"
              icon="business-outline"
              label="Empresário ou criador de conteúdo"
              onPress={() => field.onChange('business')}
              selected={field.value === 'business'}
            />
          </View>
        )}
      />
      <View style={styles.infoBox}>
        <Ionicons color={colors.primary} name="information-circle-outline" size={18} />
        <Text style={styles.infoText}>Você pode alternar o tipo de conta a qualquer momento no app.</Text>
      </View>
    </View>
  );
}

function Heading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View style={styles.heading}>
      {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

type FieldProps = {
  control: Control<Values>;
  label: string;
  name: Exclude<keyof Values, 'type'>;
  onValueChange?: (value: string) => void;
} & Omit<React.ComponentProps<typeof TextInput>, 'onChangeText' | 'value'>;

function FormField({ control, label, name, onValueChange, ...inputProps }: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>
            {label} <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            {...inputProps}
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, fieldState.error && styles.inputError]}
            value={typeof field.value === 'string' ? field.value : ''}
          />
          {fieldState.error?.message ? <Text style={styles.error}>{fieldState.error.message}</Text> : null}
        </View>
      )}
    />
  );
}

function AccountTypeCard({
  description,
  icon,
  label,
  onPress,
  selected,
}: {
  description: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.typeCard, selected && styles.typeCardSelected, pressed && styles.pressed]}
    >
      <View style={styles.typeCardTop}>
        <Ionicons color={selected ? colors.primary : colors.foreground} name={icon} size={24} />
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <Ionicons color={colors.primaryForeground} name="checkmark" size={12} /> : null}
        </View>
      </View>
      <Text style={styles.typeTitle}>{label}</Text>
      <Text style={styles.typeDescription}>{description}</Text>
    </Pressable>
  );
}

const styles = {
  content: {
    flexGrow: 1,
    minHeight: '100%' as const,
    paddingBottom: 24,
    paddingHorizontal: spacing.screen,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    height: 40,
    justifyContent: 'space-between' as const,
  },
  backButton: { alignItems: 'center' as const, height: 40, justifyContent: 'center' as const, width: 40 },
  progress: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 13 },
  main: { flex: 1, gap: 32, paddingTop: 24 },
  heading: { gap: 4 },
  eyebrow: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 24, lineHeight: 30 },
  fields: { gap: 16 },
  fieldGroup: { gap: 8 },
  label: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    height: 48,
    paddingHorizontal: spacing.control,
  },
  inputError: { borderColor: '#EF4444' },
  error: { color: '#FCA5A5', fontFamily: 'DMSans-Regular', fontSize: 12 },
  footer: { gap: 20, marginTop: 'auto' as const, paddingTop: 24 },
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
  accountTypes: { gap: 16 },
  typeCard: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
    padding: 16,
  },
  typeCardSelected: { backgroundColor: 'rgba(185,255,112,0.12)', borderColor: colors.primary },
  typeCardTop: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  radio: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 10,
    borderWidth: 1,
    height: 18,
    justifyContent: 'center' as const,
    width: 18,
  },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  typeTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14, marginTop: 2 },
  typeDescription: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 17 },
  infoBox: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 12,
  },
  infoText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 19 },
  pressed: { opacity: 0.74 },
} as const;
