import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';

import { AccountSwitcherSheet } from '@/features/accounts/components/AccountSwitcherSheet';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AccountScreen() {
  const router = useRouter();
  const account = useSessionStore((state) => state.account);
  const logout = useSessionStore((state) => state.logout);
  const [switcherVisible, setSwitcherVisible] = useState(false);
  const isBusiness = account?.type === 'business';

  if (!account)
    return (
      <View style={styles.empty}>
        <Text style={styles.muted}>Nenhuma conta ativa</Text>
      </View>
    );

  async function handleLogout() {
    await logout();
    router.replace('/');
  }

  function openDevelopment(feature: string) {
    router.push({ pathname: '/(app)/under-development', params: { feature } } as never);
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.accountCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(account.display_name ?? account.name ?? account.email).slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.accountInfo}>
            <Text numberOfLines={1} style={styles.accountName}>
              {account.display_name ?? account.name ?? 'Minha conta'}
            </Text>
            {isBusiness ? (
              <Text style={styles.badge}>Empresa</Text>
            ) : (
              <Text style={styles.muted}>@{account.slug ?? account.email.split('@')[0]}</Text>
            )}
          </View>
          <Pressable onPress={() => setSwitcherVisible(true)}>
            <Ionicons color={colors.foreground} name="chevron-down" size={20} />
          </Pressable>
        </View>
        {isBusiness ? (
          <Section
            title="Gerenciamento"
            items={[
              ['storefront-outline', 'Meu negócio'],
              ['calendar-outline', 'Meus eventos'],
            ]}
            onDevelopment={openDevelopment}
          />
        ) : (
          <Section
            title="Você"
            items={[
              ['person-outline', 'Meu perfil'],
              ['heart-outline', 'Favoritos'],
            ]}
            onFavorite={() => router.push('/(app)/favorites')}
            onDevelopment={openDevelopment}
          />
        )}
        <Section
          title="Configurações"
          items={[
            ['shield-checkmark-outline', 'Segurança'],
            ['notifications-outline', 'Notificações'],
            ['settings-outline', 'Configurações do aplicativo'],
          ]}
          onSettings={() => router.push('/(app)/settings')}
          onDevelopment={openDevelopment}
        />
        <Section
          title="Informações"
          items={[
            ['help-circle-outline', 'Suporte e Ajuda'],
            ['warning-outline', 'Reportar problema'],
            ['information-circle-outline', 'Sobre'],
          ]}
          onDevelopment={openDevelopment}
        />
        <Pressable
          onPress={() =>
            Alert.alert('Sair', 'Deseja sair desta conta?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: handleLogout },
            ])
          }
          style={styles.logout}
        >
          <Ionicons color="#F87171" name="log-out-outline" size={23} />
          <Text style={styles.logoutText}>Sair</Text>
        </Pressable>
      </ScrollView>
      <AccountSwitcherSheet onClose={() => setSwitcherVisible(false)} visible={switcherVisible} />
    </View>
  );
}

function Section({
  items,
  onDevelopment,
  onFavorite,
  onSettings,
  title,
}: {
  items: [keyof typeof Ionicons.glyphMap, string][];
  onDevelopment: (feature: string) => void;
  onFavorite?: () => void;
  onSettings?: () => void;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.help}>Ajuda</Text>
      </View>
      {items.map(([icon, label]) => (
        <Pressable
          key={label}
          onPress={
            label === 'Favoritos'
              ? onFavorite
              : label === 'Configurações do aplicativo'
                ? onSettings
                : () => onDevelopment(label)
          }
          style={[
            styles.menuRow,
            label !== 'Favoritos' && label !== 'Configurações do aplicativo' && styles.disabled,
          ]}
        >
          <Ionicons
            color={
              label !== 'Favoritos' && label !== 'Configurações do aplicativo'
                ? colors.mutedForeground
                : colors.foreground
            }
            name={icon}
            size={23}
          />
          <Text
            style={[
              styles.menuText,
              label !== 'Favoritos' &&
                label !== 'Configurações do aplicativo' &&
                styles.disabledText,
            ]}
          >
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 18, padding: 24, paddingBottom: 32 },
  accountCard: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    paddingBottom: 10,
  },
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
  accountName: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  badge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: colors.primary,
    borderRadius: 5,
    color: colors.primaryForeground,
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    overflow: 'hidden' as const,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  muted: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 16 },
  section: { borderTopColor: colors.border, borderTopWidth: 1, gap: 2, paddingTop: 14 },
  sectionHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  help: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 13 },
  menuRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 10,
    paddingVertical: 14,
  },
  menuText: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 15 },
  disabled: { opacity: 0.48 },
  disabledText: { color: colors.mutedForeground },
  logout: {
    alignItems: 'center' as const,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    paddingTop: 22,
  },
  logoutText: { color: '#F87171', fontFamily: 'DMSans-Medium', fontSize: 15 },
  empty: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    justifyContent: 'center' as const,
  },
} as const;
