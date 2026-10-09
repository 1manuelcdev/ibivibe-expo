import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { AdminMetricsSkeleton } from '@/features/admin/components/AdminSkeleton';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi, type AdminOverview } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

type Metric = {
  icon: keyof typeof Ionicons.glyphMap;
  key: keyof Omit<AdminOverview, 'generated_at'>;
  label: string;
};

const metrics: Metric[] = [
  { icon: 'people-outline', key: 'accounts', label: 'Contas' },
  { icon: 'storefront-outline', key: 'businesses', label: 'Empresas' },
  { icon: 'calendar-outline', key: 'events', label: 'Eventos' },
  { icon: 'location-outline', key: 'cities', label: 'Cidades' },
  { icon: 'funnel-outline', key: 'leads', label: 'Leads' },
  { icon: 'star-outline', key: 'reviews', label: 'Avaliações' },
];

export function AdminPanelScreen() {
  const account = useSessionStore((state) => state.account);
  const router = useRouter();
  const overview = useQuery({ queryFn: adminApi.getOverview, queryKey: ['admin', 'overview'] });

  if (!isAdminAccount(account)) return <DeniedState />;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AdminOverviewBackButton />
          <Text style={styles.title}>Painel admin</Text>
          <Pressable
            accessibilityLabel="Atualizar resumo operacional"
            disabled={overview.isFetching}
            hitSlop={8}
            onPress={() => overview.refetch()}
            style={overview.isFetching && styles.disabled}
          >
            <Ionicons color={colors.mutedForeground} name="refresh" size={21} />
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Resumo operacional</Text>
            <Text style={styles.sectionDescription}>Visão geral da plataforma.</Text>
          </View>
        </View>
        {overview.isError ? (
          <OverviewError onRetry={() => overview.refetch()} />
        ) : overview.isLoading ? (
          <AdminMetricsSkeleton />
        ) : (
          <View style={styles.metrics}>
            {metrics.map((metric) => (
              <MetricCard key={metric.key} metric={metric} value={overview.data?.[metric.key]} />
            ))}
          </View>
        )}

        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>Gerenciamento</Text>
          <Pressable
            accessibilityHint="Abre a gestão de cidades"
            accessibilityRole="button"
          onPress={() => router.push('/(app)/admin/cities')}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="location-outline" size={22} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Cidades</Text>
            <Text style={styles.actionDescription}>Informações, tags e mídias.</Text>
            </View>
            <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
          </Pressable>
          <Pressable
            accessibilityHint="Abre a gestão de tags"
            accessibilityRole="button"
          onPress={() => router.push('/(app)/admin/tags')}
          style={({ pressed }) => [styles.action, pressed && styles.pressed]}
        >
          <Ionicons color={colors.foreground} name="pricetags-outline" size={22} />
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Tags</Text>
              <Text style={styles.actionDescription}>Nome, descrição, cor e ordem.</Text>
            </View>
            <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function MetricCard({ metric, value }: { metric: Metric; value?: number }) {
  return (
    <View style={styles.metric}>
      <Ionicons color={colors.mutedForeground} name={metric.icon} size={18} />
      <Text style={styles.metricValue}>{value === undefined ? '—' : formatNumber(value)}</Text>
      <Text style={styles.metricLabel}>{metric.label}</Text>
    </View>
  );
}

function OverviewError({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.error}>
      <Text style={styles.errorText}>Não foi possível carregar o resumo operacional.</Text>
      <Pressable onPress={onRetry}>
        <Text style={styles.retryLabel}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}

function DeniedState() {
  return (
    <View style={styles.screen}>
      <View style={styles.deniedHeader}>
        <AdminOverviewBackButton />
        <Text style={styles.title}>Painel admin</Text>
      </View>
      <View style={styles.denied}>
        <Ionicons color={colors.mutedForeground} name="lock-closed-outline" size={28} />
        <Text style={styles.deniedTitle}>Acesso restrito</Text>
        <Text style={styles.deniedText}>Esta área está disponível somente para administradores.</Text>
      </View>
    </View>
  );
}

function AdminOverviewBackButton() {
  const router = useRouter();

  return (
    <Pressable
      accessibilityLabel="Voltar para conta"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => router.replace('/(app)/accounts')}
      style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
    >
      <Ionicons color={colors.foreground} name="arrow-back" size={24} />
    </Pressable>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('pt-BR').format(value);
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 24, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  backButton: { alignItems: 'center' as const, height: 32, justifyContent: 'center' as const, width: 32 },
  title: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  sectionHeader: { alignItems: 'flex-start' as const, flexDirection: 'row' as const, justifyContent: 'space-between' as const },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  sectionDescription: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 13, marginTop: 3 },
  metrics: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  metric: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    flexGrow: 1,
    gap: 6,
    minWidth: '30%' as const,
    padding: 14,
  },
  metricValue: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  metricLabel: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  actionsSection: { gap: 8 },
  action: {
    alignItems: 'center' as const,
    backgroundColor: '#18181B',
    borderRadius: 14,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 76,
    padding: 12,
  },
  actionContent: { flex: 1, gap: 3 },
  actionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  actionDescription: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  error: { alignItems: 'flex-start' as const, gap: 8, paddingVertical: 8 },
  errorText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retryLabel: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, paddingVertical: 4 },
  pressed: { opacity: 0.65 },
  disabled: { opacity: 0.5 },
  deniedHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16, padding: 24 },
  denied: { alignItems: 'center' as const, flex: 1, gap: 10, justifyContent: 'center' as const, padding: 24 },
  deniedTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  deniedText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14, textAlign: 'center' as const },
} as const;
