import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function ManageAccountsScreen() {
  const router = useRouter();
  const account = useSessionStore((state) => state.account);
  const displayName = account?.display_name ?? account?.name ?? account?.email ?? 'Conta';

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" onPress={() => router.back()}>
            <Ionicons color={colors.foreground} name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.title}>Minhas contas</Text>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => router.push('/(auth)/login')} style={styles.outlineButton}>
            <Ionicons color={colors.foreground} name="log-in-outline" size={19} />
            <Text style={styles.outlineText}>Entrar</Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/register')} style={styles.primaryButton}>
            <Ionicons color={colors.primaryForeground} name="person-add-outline" size={19} />
            <Text style={styles.primaryText}>Criar conta</Text>
          </Pressable>
        </View>

        {account ? (
          <View style={[styles.accountCard, styles.activeCard]}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{displayName.slice(0, 1).toUpperCase()}</Text>
            </View>
            <View style={styles.accountInfo}>
              <Text numberOfLines={1} style={styles.accountName}>
                {displayName}
              </Text>
              <Text numberOfLines={1} style={styles.email}>
                {account.email}
              </Text>
            </View>
            <View style={styles.activeBadge}>
              <Text style={styles.activeText}>Ativa</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons color={colors.mutedForeground} name="person-circle-outline" size={64} />
            <Text style={styles.emptyTitle}>Nenhuma conta encontrada</Text>
          </View>
        )}

        <Text style={styles.helper}>
          As contas salvas neste dispositivo aparecerão aqui. A conta ativa não pode ser removida.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 16, padding: 24, paddingBottom: 32 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 8,
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 22,
    marginLeft: 16,
  },
  headerSpacer: { width: 24 },
  actions: { flexDirection: 'row' as const, gap: 12 },
  outlineButton: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 7,
    height: 48,
    justifyContent: 'center' as const,
  },
  outlineText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  primaryButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 7,
    height: 48,
    justifyContent: 'center' as const,
  },
  primaryText: { color: colors.primaryForeground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  accountCard: {
    alignItems: 'center' as const,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 14,
  },
  activeCard: { backgroundColor: 'rgba(159,255,139,0.08)', borderColor: 'rgba(159,255,139,0.55)' },
  avatar: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center' as const,
    width: 48,
  },
  avatarText: { color: colors.primaryForeground, fontFamily: 'DMSans-Bold', fontSize: 20 },
  accountInfo: { flex: 1, gap: 4 },
  accountName: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 15 },
  email: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 13 },
  activeBadge: {
    backgroundColor: colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  activeText: { color: colors.primaryForeground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  helper: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    lineHeight: 19,
  },
  emptyState: { alignItems: 'center' as const, gap: 12, paddingVertical: 48 },
  emptyTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 15 },
} as const;
