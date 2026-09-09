import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { businessEditorApi } from '@/features/businesses/business-editor-api';
import { invalidateBusinessCaches } from '@/features/businesses/business-cache';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
import { useOnboardingInterestsData } from '@/features/onboarding/viewmodels/useOnboardingData';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

const MAX_TAGS = 4;

export function BusinessTagsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accountId = useSessionStore((state) => state.account?.id);
  const editor = useQuery({
    enabled: Boolean(accountId),
    queryFn: () => businessEditorApi.getEditorData(accountId!),
    queryKey: ['business-editor', accountId],
  });
  const { tagGroups, tags } = useOnboardingInterestsData();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | 'all'>('all');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState<OnboardingTag[]>(
    () =>
      editor.data?.tags
        .filter((tag) => editor.data?.profile.tags?.includes(tag.name))
        .slice(0, MAX_TAGS) ?? [],
  );

  const groups = useMemo(() => {
    const allTags = tags.data ?? [];
    const known = (tagGroups.data ?? []).map((group) => ({
      ...group,
      tags: allTags.filter((tag) => tag.group_id === group.id),
    }));
    const groupedIds = new Set(known.map((group) => group.id));
    const ungrouped = allTags.filter((tag) => !groupedIds.has(tag.group_id));
    return ungrouped.length ? [...known, { id: 'other', name: 'Outros', tags: ungrouped }] : known;
  }, [tagGroups.data, tags.data]);

  const normalizedSearch = search.trim().toLocaleLowerCase('pt-BR');
  const visibleGroups = useMemo(
    () =>
      groups
        .filter((group) => activeGroup === 'all' || group.id === activeGroup)
        .map((group) => ({
          ...group,
          tags: normalizedSearch
            ? group.tags.filter((tag) =>
                tag.name.toLocaleLowerCase('pt-BR').includes(normalizedSearch),
              )
            : group.tags,
        }))
        .filter((group) => group.tags.length),
    [activeGroup, groups, normalizedSearch],
  );

  const save = useMutation({
    mutationFn: () =>
      businessEditorApi.updateTags(
        editor.data!.business.id,
        selected.map((tag) => tag.id),
      ),
    onSuccess: async () => {
      await invalidateBusinessCaches(queryClient, editor.data!.business.id);
      router.back();
    },
    onError: () => Alert.alert('Não foi possível salvar as tags', 'Tente novamente.'),
  });

  function toggle(tag: OnboardingTag) {
    setSelected((current) => {
      if (current.some((item) => item.id === tag.id))
        return current.filter((item) => item.id !== tag.id);
      if (current.length === MAX_TAGS) {
        Alert.alert('Limite de tags', `Você pode selecionar até ${MAX_TAGS} tags.`);
        return current;
      }
      return [...current, tag];
    });
  }

  function chooseGroup(groupId: string | 'all') {
    setActiveGroup(groupId);
    setOpenGroup(groupId === 'all' ? null : groupId);
  }

  if (editor.isLoading || tagGroups.isLoading || tags.isLoading) return <TagsState loading />;
  if (editor.isError || !editor.data || tagGroups.isError || tags.isError)
    return (
      <TagsState
        error
        onRetry={() => void Promise.all([editor.refetch(), tagGroups.refetch(), tags.refetch()])}
      />
    );

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()}>
          <Ionicons color={colors.foreground} name="arrow-back" size={25} />
        </Pressable>
        <Text style={styles.title}>Tags</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headline}>
          <Text style={styles.copy}>
            Adicione até {MAX_TAGS - selected.length} (máx. {MAX_TAGS} no plano básico)
          </Text>
          {selected.length ? (
            <View style={styles.selectedTags}>
              {selected.map((tag) => (
                <Pressable key={tag.id} onPress={() => toggle(tag)} style={styles.selectedTag}>
                  <Text style={styles.selectedTagText}>{tag.name}</Text>
                  <Ionicons color={colors.foreground} name="close" size={15} />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.emptySelection}>Nenhuma tag selecionada ainda.</Text>
          )}
        </View>
        <View style={styles.divider} />
        <TextField
          containerStyle={styles.searchField}
          onChangeText={setSearch}
          placeholder="Pesquise entre as tags"
          value={search}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryList}
        >
          <CategoryButton
            active={activeGroup === 'all'}
            label="Todas"
            onPress={() => chooseGroup('all')}
          />
          {groups.map((group) => (
            <CategoryButton
              active={activeGroup === group.id}
              key={group.id}
              label={group.name}
              onPress={() => chooseGroup(group.id)}
            />
          ))}
        </ScrollView>
        <View style={styles.accordions}>
          {visibleGroups.map((group) => {
            const expanded = normalizedSearch.length > 0 || openGroup === group.id;
            const selectedCount = group.tags.filter((tag) =>
              selected.some((item) => item.id === tag.id),
            ).length;
            return (
              <View key={group.id} style={styles.accordion}>
                <Pressable
                  onPress={() => setOpenGroup(expanded ? null : group.id)}
                  style={styles.accordionTrigger}
                >
                  <View style={styles.groupRow}>
                    <Ionicons
                      color={colors.mutedForeground}
                      name={groupIcon(group.name)}
                      size={21}
                    />
                    <Text style={styles.groupName}>{group.name}</Text>
                    {selectedCount ? (
                      <Text style={styles.selectedCount}>{selectedCount}</Text>
                    ) : null}
                  </View>
                  <Ionicons
                    color={colors.mutedForeground}
                    name={expanded ? 'chevron-up' : 'chevron-down'}
                    size={19}
                  />
                </Pressable>
                {expanded ? (
                  <View style={styles.tagOptions}>
                    {group.tags.map((tag) => (
                      <TagOption
                        key={tag.id}
                        selected={selected.some((item) => item.id === tag.id)}
                        tag={tag}
                        onPress={() => toggle(tag)}
                      />
                    ))}
                  </View>
                ) : null}
              </View>
            );
          })}
          {!visibleGroups.length ? (
            <Text style={styles.emptySelection}>Nenhuma tag encontrada.</Text>
          ) : null}
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          disabled={save.isPending}
          onPress={() => save.mutate()}
          style={[styles.saveButton, save.isPending && styles.disabled]}
        >
          <Text style={styles.saveLabel}>{save.isPending ? 'Salvando…' : 'Salvar tags'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

function CategoryButton({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.category, active && styles.categoryActive]}>
      <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{label}</Text>
    </Pressable>
  );
}

function TagOption({
  onPress,
  selected,
  tag,
}: {
  onPress: () => void;
  selected: boolean;
  tag: OnboardingTag;
}) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.tagOption, selected && styles.tagOptionSelected]}
    >
      <Text style={[styles.tagOptionLabel, selected && styles.tagOptionLabelSelected]}>
        {tag.name}
      </Text>
    </Pressable>
  );
}

function TagsState({
  error,
  loading,
  onRetry,
}: {
  error?: boolean;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <Ionicons color={colors.mutedForeground} name="alert-circle-outline" size={42} />
      )}
      <Text style={styles.copy}>
        {loading ? 'Carregando tags…' : 'Não foi possível carregar as tags.'}
      </Text>
      {error && onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.retry}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function groupIcon(name: string): keyof typeof Ionicons.glyphMap {
  const normalized = name.toLocaleLowerCase('pt-BR');
  if (normalized.includes('alimenta')) return 'restaurant-outline';
  if (normalized.includes('turismo')) return 'airplane-outline';
  if (normalized.includes('cultura') || normalized.includes('lazer'))
    return 'color-palette-outline';
  if (normalized.includes('saúde')) return 'heart-outline';
  if (normalized.includes('serviço')) return 'construct-outline';
  if (normalized.includes('indústria')) return 'business-outline';
  return 'storefront-outline';
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  content: { gap: 20, padding: 16, paddingBottom: 108 },
  headline: { gap: 12 },
  copy: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14, lineHeight: 20 },
  selectedTags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  selectedTag: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  selectedTagText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  emptySelection: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  divider: { backgroundColor: '#27272A', height: 2, width: '100%' },
  searchField: { width: '100%' },
  categoryList: { gap: 8, paddingRight: 16 },
  category: {
    backgroundColor: '#27272A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryActive: { backgroundColor: colors.foreground },
  categoryLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  categoryLabelActive: { color: colors.background, fontFamily: 'DMSans-SemiBold' },
  accordions: { borderTopColor: colors.border, borderTopWidth: 1 },
  accordion: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  accordionTrigger: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 58,
    paddingHorizontal: 12,
  },
  groupRow: { alignItems: 'center' as const, flex: 1, flexDirection: 'row' as const, gap: 8 },
  groupName: {
    color: colors.foreground,
    flexShrink: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
  },
  selectedCount: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    color: colors.primaryForeground,
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    textAlign: 'center' as const,
  },
  tagOptions: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: 8,
    paddingBottom: 16,
    paddingHorizontal: 12,
  },
  tagOption: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  tagOptionSelected: {
    backgroundColor: 'rgba(159,255,139,0.1)',
    borderColor: colors.primary,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
  },
  tagOptionLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 12 },
  tagOptionLabelSelected: { color: colors.primary },
  footer: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    padding: 16,
  },
  saveButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center' as const,
  },
  saveLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  state: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center' as const,
    padding: 24,
  },
  retry: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  disabled: { opacity: 0.5 },
} as const;
