import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { TextField } from '@/components/TextField';
import { businessEditorApi } from '@/features/businesses/business-editor-api';
import { invalidateBusinessCaches } from '@/features/businesses/business-cache';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
import { useOnboardingInterestsData } from '@/features/onboarding/viewmodels/useOnboardingData';
import { colors } from '@/theme/tokens';

const MAX_TAGS = 4;

export function BusinessTagsSheet({
  businessId,
  onClose,
  onSaved,
  selectedNames,
  visible,
}: {
  businessId: string;
  onClose: () => void;
  onSaved: () => void;
  selectedNames: string[];
  visible: boolean;
}) {
  const queryClient = useQueryClient();
  const { tagGroups, tags } = useOnboardingInterestsData();
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | 'all'>('all');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [selected, setSelected] = useState(selectedNames);

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
    mutationFn: () => {
      const tagIds = (tags.data ?? [])
        .filter((tag) => selected.includes(tag.name))
        .map((tag) => tag.id);
      return businessEditorApi.updateTags(businessId, tagIds);
    },
    onError: () => Alert.alert('Não foi possível salvar as tags', 'Tente novamente.'),
    onSuccess: async () => {
      await invalidateBusinessCaches(queryClient, businessId);
      onSaved();
      onClose();
    },
  });

  function toggle(tag: OnboardingTag) {
    setSelected((current) => {
      if (current.includes(tag.name)) return current.filter((name) => name !== tag.name);
      if (current.length === MAX_TAGS) {
        Alert.alert('Limite de tags', `Você pode selecionar até ${MAX_TAGS} tags.`);
        return current;
      }
      return [...current, tag.name];
    });
  }

  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tags do negócio</Text>
          <Text style={styles.copy}>Adicione até {MAX_TAGS - selected.length} tags</Text>
        </View>
        <Pressable accessibilityLabel="Fechar" onPress={onClose}>
          <Ionicons color={colors.foreground} name="close" size={24} />
        </Pressable>
      </View>
      {selected.length ? (
        <View style={styles.selectedTags}>
          {selected.map((name) => (
            <Pressable
              key={name}
              onPress={() => setSelected(selected.filter((item) => item !== name))}
              style={styles.selectedTag}
            >
              <Text style={styles.selectedTagText}>{name}</Text>
              <Ionicons color={colors.foreground} name="close" size={15} />
            </Pressable>
          ))}
        </View>
      ) : null}
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
          onPress={() => setActiveGroup('all')}
        />
        {groups.map((group) => (
          <CategoryButton
            active={activeGroup === group.id}
            key={group.id}
            label={group.name}
            onPress={() => {
              setActiveGroup(group.id);
              setOpenGroup(group.id);
            }}
          />
        ))}
      </ScrollView>
      <ScrollView contentContainerStyle={styles.accordions} showsVerticalScrollIndicator={false}>
        {visibleGroups.map((group) => {
          const expanded = normalizedSearch.length > 0 || openGroup === group.id;
          const selectedCount = group.tags.filter((tag) => selected.includes(tag.name)).length;
          return (
            <View key={group.id} style={styles.accordion}>
              <Pressable
                onPress={() => setOpenGroup(expanded ? null : group.id)}
                style={styles.accordionTrigger}
              >
                <View style={styles.groupRow}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  {selectedCount ? <Text style={styles.selectedCount}>{selectedCount}</Text> : null}
                </View>
                <Ionicons
                  color={colors.mutedForeground}
                  name={expanded ? 'chevron-up' : 'chevron-down'}
                  size={19}
                />
              </Pressable>
              {expanded ? (
                <View style={styles.tagOptions}>
                  {group.tags.map((tag) => {
                    const isSelected = selected.includes(tag.name);
                    return (
                      <Pressable
                        key={tag.id}
                        onPress={() => toggle(tag)}
                        style={[styles.tagOption, isSelected && styles.tagOptionSelected]}
                      >
                        <Text
                          style={[
                            styles.tagOptionLabel,
                            isSelected && styles.tagOptionLabelSelected,
                          ]}
                        >
                          {tag.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          );
        })}
      </ScrollView>
      <Pressable
        disabled={save.isPending}
        onPress={() => save.mutate()}
        style={[styles.saveButton, save.isPending && styles.disabled]}
      >
        <Text style={styles.saveLabel}>{save.isPending ? 'Salvando…' : 'Salvar tags'}</Text>
      </Pressable>
    </BottomSheet>
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

const styles = {
  header: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  copy: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 13, marginTop: 4 },
  selectedTags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8, marginTop: 10 },
  selectedTag: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  selectedTagText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  searchField: { marginTop: 14 },
  categoryList: { gap: 8, paddingVertical: 12 },
  category: {
    backgroundColor: '#27272A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  categoryActive: { backgroundColor: colors.foreground },
  categoryLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  categoryLabelActive: { color: colors.background },
  accordions: { paddingBottom: 12 },
  accordion: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  accordionTrigger: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 52,
    paddingHorizontal: 8,
  },
  groupRow: { alignItems: 'center' as const, flex: 1, flexDirection: 'row' as const, gap: 8 },
  groupName: {
    color: colors.foreground,
    flexShrink: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
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
    paddingBottom: 12,
    paddingHorizontal: 8,
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
  saveButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 44,
    justifyContent: 'center' as const,
    marginBottom: 12,
    marginTop: 4,
  },
  saveLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  disabled: { opacity: 0.5 },
} as const;
