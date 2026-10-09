import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { isAdminAccount } from '@/features/admin/admin-access';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AdminPanelScreen() {
  const account = useSessionStore((state) => state.account);
  const router = useRouter();

  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/(app)/accounts');
  }

  if (!isAdminAccount(account)) {
    return (
      <View style={styles.screen}>
        <Header onBack={goBack} />
        <View style={styles.denied}>
          <Ionicons color={colors.mutedForeground} name="lock-closed-outline" size={28} />
          <Text style={styles.deniedTitle}>Acesso restrito</Text>
          <Text style={styles.deniedText}>
            Esta área está disponível somente para administradores.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Header onBack={goBack} />
        <View style={styles.intro}>
          <Text style={styles.introTitle}>Ações administrativas</Text>
          <Text style={styles.introText}>Gerencie os conteúdos que aparecem no aplicativo.</Text>
        </View>
        <View style={styles.actions}>
          <Pressable
            accessibilityHint="Abre a gestão de cidades"
            accessibilityRole="button"
            onPress={() => router.push('/(app)/admin/cities')}
            style={styles.action}
          >
            <Ionicons color={colors.foreground} name="location-outline" size={23} />
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Editar cidades</Text>
              <Text style={styles.actionDescription}>Gerencie as cidades disponíveis no app.</Text>
            </View>
            <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Header({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.header}>
      <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={onBack}>
        <Ionicons color={colors.foreground} name="arrow-back" size={25} />
      </Pressable>
      <Text style={styles.title}>Painel do Administrador</Text>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 28, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  intro: { gap: 6 },
  introTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  introText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  actions: { borderTopColor: colors.border, borderTopWidth: 1 },
  action: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 76,
    paddingVertical: 14,
  },
  actionContent: { flex: 1, gap: 3 },
  actionTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  actionDescription: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 13 },
  denied: {
    alignItems: 'center' as const,
    flex: 1,
    gap: 10,
    justifyContent: 'center' as const,
    padding: 24,
  },
  deniedTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  deniedText: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    textAlign: 'center' as const,
  },
} as const;
