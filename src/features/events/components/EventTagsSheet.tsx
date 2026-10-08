import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { TextField } from '@/components/TextField';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
import { useOnboardingTags } from '@/features/onboarding/viewmodels/useOnboardingData';
import { colors } from '@/theme/tokens';

const MAX_TAGS = 4;

export function EventTagsSheet({
  onClose,
  onSave,
  selectedTags,
  visible,
}: {
  onClose: () => void;
  onSave: (tags: OnboardingTag[]) => void;
  selectedTags: OnboardingTag[];
  visible: boolean;
}) {
  const tags = useOnboardingTags('event');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<string | 'all'>('all');
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const groups = useMemo(() => {
    const allTags = tags.data ?? [];
    const groupsById = new Map<string, { id: string; name: string; tags: OnboardingTag[] }>();
    for (const tag of allTags) {
      const group = tag.group ?? { id: tag.group_id, name: 'Outros' };
      const current = groupsById.get(group.id) ?? { ...group, tags: [] };
      current.tags.push(tag);
      groupsById.set(group.id, current);
    }
    return [...groupsById.values()];
  }, [tags.data]);
  const selectedIds = selectedTags.map((tag) => tag.id);
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

  function toggle(tag: OnboardingTag) {
    if (selectedIds.includes(tag.id)) {
      onSave(selectedTags.filter((item) => item.id !== tag.id));
      return;
    }
    if (selectedTags.length === MAX_TAGS) {
      Alert.alert('Limite de tags', `Você pode selecionar até ${MAX_TAGS} tags.`);
      return;
    }
    onSave([...selectedTags, tag]);
  }

  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Tags do evento</Text>
        </View>
        <Pressable accessibilityLabel="Fechar" onPress={onClose}>
          <Ionicons color={colors.foreground} name="close" size={24} />
        </Pressable>
      </View>
      <Text style={styles.copy}>Adicione até {MAX_TAGS - selectedTags.length} tags</Text>
      {tags.isLoading ? <ActivityIndicator color={colors.primary} style={styles.loader} /> : null}
      {tags.isError ? (
        <Text style={styles.error}>Não foi possível carregar as tags do evento.</Text>
      ) : null}
      {selectedTags.length ? (
        <View style={styles.selectedTags}>
          {selectedTags.map((tag) => (
            <Pressable
              key={tag.id}
              onPress={() => onSave(selectedTags.filter((item) => item.id !== tag.id))}
              style={styles.selectedTag}
            >
              <Text style={styles.selectedTagText}>{tag.name}</Text>
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
          const selectedCount = group.tags.filter((tag) => selectedIds.includes(tag.id)).length;
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
                    const selected = selectedIds.includes(tag.id);
                    return (
                      <Pressable
                        key={tag.id}
                        onPress={() => toggle(tag)}
                        style={[styles.tagOption, selected && styles.tagOptionSelected]}
                      >
                        <Text
                          style={[styles.tagOptionLabel, selected && styles.tagOptionLabelSelected]}
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
      <Pressable onPress={onClose} style={styles.saveButton}>
        <Text style={styles.saveLabel}>Salvar tags</Text>
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
  disclaimer: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    marginTop: 4,
    maxWidth: 280,
  },
  copy: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14, marginTop: 12 },
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
  loader: { marginTop: 14 },
  error: { color: '#FCA5A5', fontFamily: 'DMSans-Regular', fontSize: 13, marginTop: 14 },
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
} as const;
