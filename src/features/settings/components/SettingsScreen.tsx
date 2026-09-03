import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { useRecentSearchStore } from '@/features/search/stores/recent-search-store';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function SettingsScreen() {
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);
  const clearSearches = useRecentSearchStore((state) => state.clear);
  async function handleLogout() {
    await logout();
    router.replace('/');
  }
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()}>
            <Ionicons color={colors.foreground} name="arrow-back" size={24} />
          </Pressable>
          <Text style={styles.title}>Configurações</Text>
          <View style={styles.spacer} />
        </View>
        <SettingsGroup
          title="Conta"
          items={[
            ['person-outline', 'Perfil', 'Nome, foto, informações adicionais'],
            ['card-outline', 'Pagamentos', 'Assinatura, métodos e histórico'],
            ['lock-closed-outline', 'Segurança', 'Senha e autenticação'],
          ]}
          onPress={(label) => openDevelopment(router, label)}
        />
        <SettingsGroup
          title="Aparência"
          items={[
            ['moon-outline', 'Tema', 'Sistema'],
            ['globe-outline', 'Idioma', 'Português (BR)'],
          ]}
          onPress={(label) => openDevelopment(router, label)}
        />
        <View style={styles.group}>
          <Text style={styles.groupTitle}>Notificações</Text>
          <SettingRow
            disabled
            icon="notifications-outline"
            label="Notificações push"
            onPress={() => openDevelopment(router, 'Notificações push')}
            trailing={<Switch disabled trackColor={{ false: '#3F3F46', true: colors.primary }} />}
          />
          <SettingRow
            icon="alarm-outline"
            label="Lembretes"
            subtitle="Alertas e avisos"
            onPress={() => openDevelopment(router, 'Lembretes')}
          />
        </View>
        <SettingsGroup
          enabled={['Limpar cache']}
          title="Armazenamento"
          items={[['trash-outline', 'Limpar cache', 'Remover dados temporários']]}
          onPress={() =>
            Alert.alert(
              'Limpar cache',
              'Isso removerá as pesquisas recentes e os dados temporários.',
              [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Limpar', style: 'destructive', onPress: clearSearches },
              ],
            )
          }
        />
        <SettingsGroup
          title="Social e Informações"
          items={[
            ['share-social-outline', 'Compartilhe com amigos'],
            ['help-circle-outline', 'Ajuda e suporte', 'FAQ e contato'],
            ['information-circle-outline', 'Sobre o app', 'Versão 1.0.0'],
            ['document-text-outline', 'Termos de Serviço'],
            ['shield-outline', 'Política de Privacidade'],
          ]}
          onPress={(label) => openDevelopment(router, label)}
        />
        <Pressable
          onPress={() =>
            Alert.alert('Sair da conta', 'Deseja sair desta conta?', [
              { text: 'Cancelar', style: 'cancel' },
              { text: 'Sair', style: 'destructive', onPress: handleLogout },
            ])
          }
          style={styles.logout}
        >
          <Ionicons color="#F87171" name="log-out-outline" size={23} />
          <Text style={styles.logoutText}>Sair da conta</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function SettingsGroup({
  enabled = [],
  items,
  onPress,
  title,
}: {
  enabled?: string[];
  items: [keyof typeof Ionicons.glyphMap, string, string?][];
  onPress: (label: string) => void;
  title: string;
}) {
  return (
    <View style={styles.group}>
      <Text style={styles.groupTitle}>{title}</Text>
      {items.map(([icon, label, subtitle]) => (
        <SettingRow
          disabled={!enabled.includes(label)}
          key={label}
          icon={icon}
          label={label}
          onPress={() => onPress(label)}
          subtitle={subtitle}
        />
      ))}
    </View>
  );
}
function SettingRow({
  disabled = false,
  icon,
  label,
  onPress,
  subtitle,
  trailing,
}: {
  disabled?: boolean;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress?: () => void;
  subtitle?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.row, disabled && styles.disabled]}>
      <Ionicons
        color={disabled ? colors.mutedForeground : colors.foreground}
        name={icon}
        size={23}
      />
      <View style={styles.rowInfo}>
        <Text style={[styles.label, disabled && styles.disabledText]}>{label}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {trailing ?? <Ionicons color={colors.mutedForeground} name="chevron-forward" size={19} />}
    </Pressable>
  );
}
function openDevelopment(router: ReturnType<typeof useRouter>, feature: string) {
  router.push({ pathname: '/(app)/under-development', params: { feature } } as never);
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 24, padding: 24, paddingBottom: 32 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 22,
    marginLeft: 16,
  },
  spacer: { width: 24 },
  group: { borderTopColor: colors.border, borderTopWidth: 1, gap: 2, paddingTop: 14 },
  groupTitle: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    marginBottom: 2,
  },
  row: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 11,
    minHeight: 54,
    paddingVertical: 8,
  },
  rowInfo: { flex: 1, gap: 3 },
  disabled: { opacity: 0.48 },
  label: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 15 },
  disabledText: { color: colors.mutedForeground },
  subtitle: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  logout: {
    alignItems: 'center' as const,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    paddingTop: 20,
  },
  logoutText: { color: '#F87171', fontFamily: 'DMSans-Medium', fontSize: 15 },
} as const;
