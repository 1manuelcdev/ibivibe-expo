import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AccountSwitcherSheet({
  onClose,
  visible,
}: {
  onClose: () => void;
  visible: boolean;
}) {
  const router = useRouter();
  const account = useSessionStore((state) => state.account);
  const accountName = account?.display_name ?? account?.name ?? account?.email ?? 'Conta atual';

  function goTo(path: '/(auth)/login' | '/(auth)/register') {
    onClose();
    router.push(path);
  }

  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Alternar conta</Text>
        <Text style={styles.sectionTitle}>Conta ativa</Text>
        {account && (
          <View style={styles.activeAccount}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{accountName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text style={styles.accountName}>{accountName}</Text>
              <Text style={styles.muted}>
                {account.type === 'business' ? 'Empresa' : `@${account.slug ?? account.email}`}
              </Text>
            </View>
            <Ionicons color={colors.primary} name="checkmark-circle" size={23} />
          </View>
        )}
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
  activeAccount: {
    alignItems: 'center' as const,
    backgroundColor: '#24242A',
    borderColor: colors.primary,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 12,
  },
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
