import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onboardingApi } from '@/features/onboarding/onboarding-api';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
import { useOnboardingInterestsData } from '@/features/onboarding/viewmodels/useOnboardingData';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

type InterestType = 'businesses' | 'events';
type AccountInterests = { businesses: string[]; events: string[] };
type AccountWithInterests = { interests?: AccountInterests };

const screenCopy: Record<InterestType, { eyebrow: string; title: string }> = {
  businesses: { eyebrow: 'Quais empresas você quer ver? (1/2)', title: 'Negócios' },
  events: { eyebrow: 'Quais eventos você quer ver? (2/2)', title: 'Eventos' },
};

export function InterestsScreen({ type }: { type: InterestType }) {
  const router = useRouter();
  const account = useSessionStore((state) => state.account);
  const completeOnboarding = useSessionStore((state) => state.completeOnboarding);
  const updateAccount = useSessionStore((state) => state.updateAccount);
  const { tagGroups, tags } = useOnboardingInterestsData();
  const previous = (account as (typeof account & AccountWithInterests))?.interests;
  const [selected, setSelected] = useState<string[]>(previous?.[type] ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const copy = screenCopy[type];

  const groups = useMemo(() => {
    const loadedTags = tags.data ?? [];
    const loadedGroups = tagGroups.data ?? [];
    const knownGroups = loadedGroups.map((group) => ({
      id: group.id,
      name: group.name,
      tags: loadedTags.filter((tag) => tag.group_id === group.id),
    }));
    const ungrouped = loadedTags.filter((tag) => !loadedGroups.some((group) => group.id === tag.group_id));
    return ungrouped.length ? [...knownGroups, { id: 'other', name: 'Outros', tags: ungrouped }] : knownGroups;
  }, [tagGroups.data, tags.data]);

  function toggle(tagId: string) {
    setSelected((current) => (current.includes(tagId) ? current.filter((id) => id !== tagId) : [...current, tagId]));
  }

  async function save(next: InterestType, nextSelection: string[]) {
    if (!account) return;
    const interests: AccountInterests = {
      businesses: next === 'businesses' ? nextSelection : (previous?.businesses ?? []),
      events: next === 'events' ? nextSelection : (previous?.events ?? []),
    };
    await onboardingApi.saveInterests(account.id, interests);
    return { ...account, interests };
  }

  async function continueFlow(selection = selected) {
    if (!account) return;
    setIsSaving(true);
    try {
      const updated = await save(type, selection);
      if (!updated) return;
      if (type === 'businesses') {
        updateAccount(updated);
        router.push('/(onboarding)/user/events');
      } else {
        await completeOnboarding(updated);
        router.replace('/(app)/home');
      }
    } catch {
      Alert.alert('Não foi possível salvar seus interesses', 'Tente novamente em alguns instantes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function skip() {
    await continueFlow([]);
  }

  const isLoading = tagGroups.isLoading || tags.isLoading;
  const error = tagGroups.isError || tags.isError;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()} style={styles.backButton}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
        <View style={styles.steps}>
          <View style={styles.activeStep} />
          <View style={type === 'events' ? styles.activeStep : styles.inactiveStep} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          <Text style={styles.title}>{copy.title}</Text>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressValue, { width: `${Math.min(100, selected.length * 16)}%` }]} />
          </View>
          <Text style={styles.count}>{selected.length} selecionada(s)</Text>
          <Ionicons color={colors.mutedForeground} name="help-circle-outline" size={17} />
        </View>
        {isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
        {error ? <Text style={styles.error}>Não foi possível carregar as categorias.</Text> : null}
        {groups.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.groupTitle}>{group.name}</Text>
            <View style={styles.chips}>
              {group.tags.map((tag) => (
                <InterestChip key={tag.id} selected={selected.includes(tag.id)} tag={tag} onPress={() => toggle(tag.id)} />
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <Pressable disabled={isSaving} onPress={skip} style={styles.ghostButton}>
          <Text style={styles.ghostLabel}>Pular</Text>
        </Pressable>
        <Pressable disabled={isSaving || !selected.length} onPress={() => void continueFlow()} style={[styles.primaryButton, (!selected.length || isSaving) && styles.disabledButton]}>
          <Text style={styles.primaryLabel}>{isSaving ? 'Salvando...' : type === 'events' ? 'Finalizar' : 'Continuar'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function InterestChip({ onPress, selected, tag }: { onPress: () => void; selected: boolean; tag: OnboardingTag }) {
  return (
    <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.chip, selected && styles.chipSelected]}>
      {selected ? <Ionicons color={colors.primaryForeground} name="checkmark" size={14} /> : null}
      <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>{tag.name}</Text>
    </Pressable>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, paddingHorizontal: 24, paddingTop: 12 },
  backButton: { alignItems: 'center' as const, height: 36, justifyContent: 'center' as const, width: 36 },
  steps: { flex: 1, flexDirection: 'row' as const, gap: 12, justifyContent: 'center' as const, marginRight: 36 },
  activeStep: { backgroundColor: colors.foreground, borderRadius: 8, height: 8, width: 8 },
  inactiveStep: { backgroundColor: colors.border, borderRadius: 8, height: 8, width: 8 },
  content: { gap: 24, padding: 24, paddingBottom: 12 },
  heading: { gap: 4 },
  eyebrow: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 24 },
  progressRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10 },
  progressTrack: { backgroundColor: colors.mutedForeground, borderRadius: 12, flex: 1, height: 4, overflow: 'hidden' as const },
  progressValue: { backgroundColor: colors.primary, borderRadius: 12, height: 4, minWidth: 0 },
  count: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 16 },
  loader: { marginTop: 24 },
  error: { color: '#FCA5A5', fontFamily: 'DMSans-Regular', fontSize: 16 },
  group: { gap: 12 },
  groupTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: { alignItems: 'center' as const, backgroundColor: '#27272A', borderRadius: 10, flexDirection: 'row' as const, gap: 4, minHeight: 36, paddingHorizontal: 12, paddingVertical: 8 },
  chipSelected: { backgroundColor: colors.primary },
  chipLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 16 },
  chipLabelSelected: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold' },
  footer: { flexDirection: 'row' as const, gap: 10, padding: 24, paddingTop: 12 },
  ghostButton: { alignItems: 'center' as const, flex: 1, height: 48, justifyContent: 'center' as const },
  ghostLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  primaryButton: { alignItems: 'center' as const, backgroundColor: colors.primary, borderRadius: 24, flex: 1, height: 48, justifyContent: 'center' as const },
  disabledButton: { opacity: 0.45 },
  primaryLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
} as const;
