import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getApiErrorMessage } from '@/api/client';
import { TextField } from '@/components/TextField';
import { authApi } from '@/features/auth/auth-api';
import { useSessionStore } from '@/stores/session-store';
import { colors, radius, spacing } from '@/theme/tokens';

type DialogKind = 'change-email' | 'manual-token' | null;

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string | string[] }>();
  const account = useSessionStore((state) => state.account);
  const completeEmailVerification = useSessionStore((state) => state.completeEmailVerification);
  const updateAccount = useSessionStore((state) => state.updateAccount);
  const [isLoading, setIsLoading] = useState(false);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const verifiedToken = useRef<string | null>(null);

  const verify = useCallback(
    async (rawToken: string) => {
      const verificationToken = rawToken.trim();
      if (!verificationToken || isLoading) return;

      setIsLoading(true);
      setError(null);
      setMessage(null);

      try {
        await authApi.verifyEmail(verificationToken);
        await completeEmailVerification();
        setMessage('E-mail confirmado. Vamos continuar seu cadastro.');
        router.replace('/(onboarding)');
      } catch (requestError) {
        setError(getApiErrorMessage(requestError));
      } finally {
        setIsLoading(false);
      }
    },
    [completeEmailVerification, isLoading, router],
  );

  useEffect(() => {
    const deepLinkToken = Array.isArray(token) ? token[0] : token;
    if (!deepLinkToken || verifiedToken.current === deepLinkToken) return;

    verifiedToken.current = deepLinkToken;
    void verify(deepLinkToken);
  }, [token, verify]);

  const resend = async () => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authApi.resendVerificationEmail();
      setMessage('Enviamos um novo link de confirmação. Você pode solicitar até 3 e-mails por hora.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  const submitDialog = async (value: string) => {
    if (dialog === 'manual-token') {
      setDialog(null);
      await verify(value);
      return;
    }

    if (dialog !== 'change-email' || isLoading) return;
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await authApi.changeUnverifiedEmail(value);
      if (account) updateAccount({ ...account, email: value.trim() });
      setDialog(null);
      setMessage('E-mail atualizado. Enviamos uma nova confirmação para o endereço informado.');
    } catch (requestError) {
      setError(getApiErrorMessage(requestError));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons color={colors.primary} name="mail-unread-outline" size={42} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.title}>Confirme seu e-mail</Text>
          <Text style={styles.subtitle}>
            Enviamos um link de confirmação para {account?.email ?? 'o seu e-mail'}. Abra-o para
            continuar o cadastro.
          </Text>
        </View>

        {isLoading ? <ActivityIndicator color={colors.primary} size="small" /> : null}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {message ? <Text style={styles.message}>{message}</Text> : null}

        <View style={styles.actions}>
          <ActionButton label="Enviar novamente" onPress={() => void resend()} primary />
          <ActionButton label="Corrigir e-mail" onPress={() => setDialog('change-email')} />
          <ActionButton label="Inserir token manualmente" onPress={() => setDialog('manual-token')} />
        </View>
      </View>

      <VerificationDialog
        key={dialog ?? 'closed'}
        initialValue={dialog === 'change-email' ? account?.email ?? '' : ''}
        kind={dialog}
        loading={isLoading}
        onClose={() => setDialog(null)}
        onSubmit={(value) => void submitDialog(value)}
      />
    </SafeAreaView>
  );
}

function ActionButton({ label, onPress, primary = false }: { label: string; onPress: () => void; primary?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.button, primary && styles.primaryButton, pressed && styles.pressed]}
    >
      <Text style={[styles.buttonLabel, primary && styles.primaryButtonLabel]}>{label}</Text>
    </Pressable>
  );
}

function VerificationDialog({
  initialValue,
  kind,
  loading,
  onClose,
  onSubmit,
}: {
  initialValue: string;
  kind: DialogKind;
  loading: boolean;
  onClose: () => void;
  onSubmit: (value: string) => void;
}) {
  const [value, setValue] = useState(initialValue);

  const isEmail = kind === 'change-email';
  const title = isEmail ? 'Corrigir e-mail' : 'Usar token do e-mail';
  const description = isEmail
    ? 'Atualize o endereço e enviaremos uma nova confirmação.'
    : 'Cole o token recebido por e-mail para confirmar sua conta.';

  return (
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={kind !== null}>
      <View style={styles.modalBackdrop}>
        <View style={styles.dialog}>
          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogDescription}>{description}</Text>
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            containerStyle={styles.inputContainer}
            inputStyle={styles.input}
            keyboardType={isEmail ? 'email-address' : 'default'}
            onChangeText={setValue}
            onSubmitEditing={() => onSubmit(value)}
            placeholder={isEmail ? 'voce@email.com' : 'Cole o token aqui'}
            returnKeyType="done"
            value={value}
          />
          <View style={styles.dialogActions}>
            <ActionButton label="Cancelar" onPress={onClose} />
            <ActionButton
              label={loading ? 'Aguarde...' : 'Continuar'}
              onPress={() => onSubmit(value)}
              primary
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = {
  safeArea: { backgroundColor: colors.background, flex: 1 },
  container: {
    alignItems: 'center' as const,
    flex: 1,
    justifyContent: 'center' as const,
    paddingHorizontal: spacing.screen,
  },
  iconWrap: {
    alignItems: 'center' as const,
    backgroundColor: '#22331F',
    borderRadius: 48,
    height: 96,
    justifyContent: 'center' as const,
    width: 96,
  },
  copy: { gap: 12, marginTop: 28 },
  title: {
    color: colors.foreground,
    fontFamily: 'DMSans-Bold',
    fontSize: 28,
    lineHeight: 34,
    textAlign: 'center' as const,
  },
  subtitle: {
    color: '#D4D4D8',
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 23,
    textAlign: 'center' as const,
  },
  actions: { gap: 10, marginTop: 28, width: '100%' as const },
  button: {
    alignItems: 'center' as const,
    borderRadius: radius.button,
    justifyContent: 'center' as const,
    minHeight: 48,
    paddingHorizontal: 16,
  },
  buttonLabel: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 15 },
  primaryButton: { backgroundColor: colors.primary },
  primaryButtonLabel: { color: colors.primaryForeground },
  pressed: { opacity: 0.72 },
  error: {
    color: '#FCA5A5',
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 20,
    textAlign: 'center' as const,
  },
  message: {
    color: colors.primary,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 20,
    textAlign: 'center' as const,
  },
  modalBackdrop: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    flex: 1,
    justifyContent: 'center' as const,
    padding: spacing.screen,
  },
  dialog: {
    backgroundColor: '#1A1A1D',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    width: '100%' as const,
  },
  dialogTitle: { color: colors.foreground, fontFamily: 'DMSans-Bold', fontSize: 20 },
  dialogDescription: {
    color: '#D4D4D8',
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 20,
    marginTop: 8,
  },
  inputContainer: { marginTop: 18 },
  input: { fontFamily: 'DMSans-Regular', height: 52, paddingHorizontal: 14 },
  dialogActions: { flexDirection: 'row' as const, justifyContent: 'flex-end' as const, marginTop: 12 },
} as const;
