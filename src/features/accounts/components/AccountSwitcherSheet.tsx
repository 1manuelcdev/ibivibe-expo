import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';
import type { Account } from '@/types/auth';

export function AccountSwitcherSheet({
  onClose,
  visible,
}: {
  onClose: () => void;
  visible: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const account = useSessionStore((state) => state.account);
  const sessions = useSessionStore((state) => state.sessions);
  const activateAccount = useSessionStore((state) => state.activateAccount);
  const [switchingAccountId, setSwitchingAccountId] = useState<string | null>(null);

  function goTo(path: '/(auth)/login' | '/(auth)/register') {
    onClose();
    router.push(path);
  }

  async function switchAccount(accountId: string) {
    if (accountId === account?.id || switchingAccountId) return;

    setSwitchingAccountId(accountId);
    try {
      await activateAccount(accountId);
      await queryClient.cancelQueries();
      queryClient.clear();
      onClose();
      router.replace('/(app)/home');
    } catch {
      Alert.alert(
        'Não foi possível alternar a conta',
        'Entre novamente nesta conta para continuar.',
      );
    } finally {
      setSwitchingAccountId(null);
    }
  }

  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Alternar conta</Text>
        <Text style={styles.sectionTitle}>Contas neste dispositivo</Text>
        {sessions.map(({ account: sessionAccount }) => (
          <AccountRow
            account={sessionAccount}
            key={sessionAccount.id}
            loading={switchingAccountId === sessionAccount.id}
            onPress={() => void switchAccount(sessionAccount.id)}
            selected={sessionAccount.id === account?.id}
          />
        ))}
        <SheetAction
          icon="log-in-outline"
          label="Entrar com outra conta"
          onPress={() => goTo('/(auth)/login')}
        />
        <SheetAction
          icon="person-add-outline"
          label="Criar nova conta"
          onPress={() => goTo('/(auth)/register')}
        />
        <SheetAction
          icon="settings-outline"
          label="Gerenciar contas"
          onPress={() => {
            onClose();
            router.push('/(app)/accounts/manage');
          }}
          muted
        />
      </ScrollView>
    </BottomSheet>
  );
}

function AccountRow({
  account,
  loading,
  onPress,
  selected,
}: {
  account: Account;
  loading: boolean;
  onPress: () => void;
  selected: boolean;
}) {
  const accountName = account.display_name ?? account.name ?? account.email ?? 'Conta';

  return (
    <Pressable
      accessibilityState={{ busy: loading, selected }}
      disabled={loading || selected}
      onPress={onPress}
      style={[styles.accountRow, selected && styles.activeAccount]}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{accountName.slice(0, 1).toUpperCase()}</Text>
      </View>
      <View style={styles.accountInfo}>
        <Text numberOfLines={1} style={styles.accountName}>
          {accountName}
        </Text>
        <Text numberOfLines={1} style={styles.muted}>
          {account.type === 'business' ? 'Empresa' : `@${account.slug ?? account.email}`}
        </Text>
      </View>
      {loading ? (
        <Text style={styles.muted}>Entrando…</Text>
      ) : selected ? (
        <Ionicons color={colors.primary} name="checkmark-circle" size={23} />
      ) : (
        <Ionicons color={colors.mutedForeground} name="chevron-forward" size={18} />
      )}
    </Pressable>
  );
}

function SheetAction({
  icon,
  label,
  muted,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  muted?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.action}>
      <View style={[styles.actionIcon, muted && styles.mutedIcon]}>
        <Ionicons
          color={muted ? colors.foreground : colors.mutedForeground}
          name={icon}
          size={21}
        />
      </View>
      <Text style={styles.actionText}>{label}</Text>
      <Ionicons color={colors.mutedForeground} name="chevron-forward" size={18} />
    </Pressable>
  );
}

const styles = {
  content: { gap: 12, paddingBottom: 12 },
  title: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    marginBottom: 8,
    textAlign: 'center' as const,
  },
  sectionTitle: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Medium',
    fontSize: 13,
    marginTop: 4,
  },
  accountRow: {
    alignItems: 'center' as const,
    backgroundColor: '#1E1E23',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 12,
  },
  activeAccount: { backgroundColor: '#24242A', borderColor: colors.primary },
  avatar: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 20,
    height: 40,
    justifyContent: 'center' as const,
    width: 40,
  },
  avatarText: { color: colors.primaryForeground, fontFamily: 'DMSans-Bold', fontSize: 17 },
  accountInfo: { flex: 1, gap: 3 },
  accountName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  muted: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  action: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  actionIcon: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center' as const,
    width: 40,
  },
  mutedIcon: { backgroundColor: '#27272A' },
  actionText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 14 },
} as const;
