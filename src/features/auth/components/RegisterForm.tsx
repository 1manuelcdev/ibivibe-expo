import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, type Control } from 'react-hook-form';
import { Alert, Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { Button } from '@/components/Button';
import type { RegisterFormValues } from '@/features/auth/models/auth-schemas';
import { useRegisterViewModel } from '@/features/auth/viewmodels/useRegisterViewModel';
import { colors } from '@/theme/tokens';

type Values = RegisterFormValues;
type Step = 0 | 1 | 2;

export function RegisterForm() {
  const router = useRouter();
  const { control, error, formState, setValue, submit, trigger } = useRegisterViewModel();
  const [step, setStep] = useState<Step>(0);
  const passwordInput = useRef<TextInput>(null);
  const passwordConfirmationInput = useRef<TextInput>(null);
  const slugInput = useRef<TextInput>(null);

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
    <View className="flex-1">
      <ScrollView
        contentContainerClassName="px-6 pt-4"
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        className="flex-1"
      >
        <View className="h-10 flex-row items-center justify-between">
          <Pressable accessibilityLabel="Voltar" className="size-10 items-center justify-center" hitSlop={12} onPress={back}>
            <Ionicons color={colors.foreground} name="arrow-back" size={24} />
          </Pressable>
          <Text className="font-dm-medium text-xs text-muted-foreground">Passo {step + 1} de 3</Text>
        </View>

      {step === 0 ? (
        <CredentialsStep
          control={control}
          passwordConfirmationInput={passwordConfirmationInput}
          passwordInput={passwordInput}
          onComplete={() => void next()}
        />
      ) : null}
      {step === 1 ? (
          <BasicInfoStep
            control={control}
            onComplete={() => void next()}
            onNameChange={(name) => setValue('display_name', name)}
            slugInput={slugInput}
          />
        ) : null}
        {step === 2 ? <AccountTypeStep control={control} /> : null}
      </ScrollView>
      <View className="gap-5 bg-background px-6 pb-6 pt-4">
        <Button
          disabled={formState.isSubmitting}
          onPress={() => void next()}
        >
          {formState.isSubmitting ? 'Criando conta...' : step === 2 ? 'Criar conta' : 'Continuar'}
        </Button>
        {step === 0 ? (
          <View className="flex-row items-center justify-center gap-1">
            <Text className="font-dm text-base text-zinc-300">Já tem uma conta?</Text>
            <Pressable onPress={() => router.replace('/(auth)/login')}>
              <Text className="font-dm-semibold text-base text-primary">Entrar</Text>
            </Pressable>
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CredentialsStep({
  control,
  onComplete,
  passwordConfirmationInput,
  passwordInput,
}: {
  control: Control<Values>;
  onComplete: () => void;
  passwordConfirmationInput: React.RefObject<TextInput | null>;
  passwordInput: React.RefObject<TextInput | null>;
}) {
  return (
    <View className="flex-1 gap-8 pt-6">
      <Heading eyebrow="Olá, vamos criar sua conta" title="Credenciais" />
      <View className="gap-4">
        <FormField
          autoCapitalize="none"
          autoComplete="email"
          control={control}
          keyboardType="email-address"
          label="E-mail"
          name="email"
          nextInput={passwordInput}
          placeholder="john@doe.com"
        />
        <FormField
          autoCapitalize="none"
          autoComplete="new-password"
          control={control}
          label="Senha"
          name="password"
          inputRef={passwordInput}
          nextInput={passwordConfirmationInput}
          placeholder="No mínimo 8 dígitos"
          secureTextEntry
        />
        <FormField
          autoCapitalize="none"
          autoComplete="new-password"
          control={control}
          label="Confirmação da senha"
          name="password_confirm"
          inputRef={passwordConfirmationInput}
          onSubmit={onComplete}
          placeholder="A mesma senha acima"
          secureTextEntry
        />
      </View>
    </View>
  );
}

function BasicInfoStep({
  control,
  onComplete,
  onNameChange,
  slugInput,
}: {
  control: Control<Values>;
  onComplete: () => void;
  onNameChange: (name: string) => void;
  slugInput: React.RefObject<TextInput | null>;
}) {
  return (
    <View className="flex-1 gap-8 pt-6">
      <Heading title="Informações básicas" />
      <View className="gap-4">
        <FormField
          autoComplete="name"
          control={control}
          label="Nome"
          name="name"
          nextInput={slugInput}
          onValueChange={onNameChange}
          placeholder="John Doe"
        />
        <FormField
          autoCapitalize="none"
          control={control}
          label="Usuário"
          name="slug"
          inputRef={slugInput}
          onSubmit={onComplete}
          placeholder="john-doe"
        />
      </View>
    </View>
  );
}

function AccountTypeStep({ control }: { control: Control<Values> }) {
  return (
    <View className="flex-1 gap-8 pt-6">
      <Heading eyebrow="Como você quer usar sua conta?" title="Tipo de conta" />
      <Controller
        control={control}
        name="type"
        render={({ field }) => (
          <View className="gap-4">
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
      <View className="flex-row items-center gap-2.5 rounded-control border border-border bg-muted px-2.5 py-3">
        <Ionicons color={colors.primary} name="information-circle-outline" size={18} />
        <Text className="flex-1 font-dm text-base leading-5 text-foreground">Você pode alternar o tipo de conta a qualquer momento no app.</Text>
      </View>
    </View>
  );
}

function Heading({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <View className="gap-1">
      {eyebrow ? <Text className="font-dm text-base text-muted-foreground">{eyebrow}</Text> : null}
      <Text className="font-dm-medium text-2xl leading-8 text-foreground">{title}</Text>
    </View>
  );
}

type FieldProps = {
  control: Control<Values>;
  label: string;
  name: Exclude<keyof Values, 'type'>;
  inputRef?: React.RefObject<TextInput | null>;
  nextInput?: React.RefObject<TextInput | null>;
  onSubmit?: () => void;
  onValueChange?: (value: string) => void;
} & Omit<React.ComponentProps<typeof TextField>, 'error' | 'label' | 'onChangeText' | 'value'>;

function FormField({
  control,
  inputRef,
  label,
  name,
  nextInput,
  onSubmit,
  onValueChange,
  ...inputProps
}: FieldProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <TextField
            {...inputProps}
            error={fieldState.error?.message}
            label={label}
            onBlur={field.onBlur}
            onChangeText={(value) => {
              field.onChange(value);
              onValueChange?.(value);
            }}
            onSubmitEditing={() => {
              if (nextInput) nextInput.current?.focus();
              else onSubmit?.();
            }}
            required
            ref={inputRef}
            returnKeyType={nextInput ? 'next' : 'done'}
            blurOnSubmit={!nextInput}
            value={typeof field.value === 'string' ? field.value : ''}
          />
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
      className={`gap-1.5 rounded-image border p-4 ${selected ? 'border-primary bg-[#1b2b19]' : 'border-border bg-muted'} active:opacity-75`}
    >
      <View className="flex-row items-center justify-between">
        <Ionicons color={selected ? colors.primary : colors.foreground} name={icon} size={24} />
        <View className={`size-[18px] items-center justify-center rounded-full border ${selected ? 'border-primary bg-primary' : 'border-border'}`}>
          {selected ? <Ionicons color={colors.primaryForeground} name="checkmark" size={12} /> : null}
        </View>
      </View>
      <Text className="mt-0.5 font-dm-medium text-base text-foreground">{label}</Text>
      <Text className="font-dm text-xs leading-4 text-foreground">{description}</Text>
    </Pressable>
  );
}
