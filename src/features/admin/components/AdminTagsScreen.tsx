import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi, type AdminTag, type AdminTagGroup } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AdminTagsScreen() {
  const account = useSessionStore((state) => state.account);
  const router = useRouter();
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const tags = useQuery({ queryFn: adminApi.getTags, queryKey: ['admin', 'tags'] });
  const groups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    const grouped = new Map<string, { group: AdminTagGroup; tags: AdminTag[] }>();

    for (const tag of tags.data ?? []) {
      const group = tag.group ?? { id: 'unassigned', name: 'Sem grupo' };
      const matches = !term || [tag.name, group.name].some((value) => value.toLocaleLowerCase('pt-BR').includes(term));
      if (!matches) continue;
      const current = grouped.get(group.id) ?? { group, tags: [] as AdminTag[] };
      current.tags.push(tag);
      grouped.set(group.id, current);
    }

    return [...grouped.values()];
  }, [search, tags.data]);
  const hasSearch = Boolean(search.trim());
  const toggleGroup = (groupId: string) =>
    setOpenGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );

  if (!isAdminAccount(account)) return null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppBackButton fallbackHref="/(app)/admin" />
          <Text style={styles.title}>Editar tags</Text>
        </View>
        <Text style={styles.description}>
          Atualize as informações das tags já cadastradas.
        </Text>
        <TextField onChangeText={setSearch} placeholder="Buscar tag ou grupo" value={search} />
        {tags.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {tags.isError ? <State text="Não foi possível carregar as tags." onPress={() => tags.refetch()} /> : null}
        {!tags.isLoading && !tags.isError && !groups.length ? (
          <State text={search ? 'Nenhuma tag encontrada.' : 'Nenhuma tag disponível.'} />
        ) : null}
        {groups.map(({ group, tags: groupTags }) => {
          const open = hasSearch || openGroups.includes(group.id);
          return (
            <View key={group.id} style={styles.group}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: open }}
                onPress={() => toggleGroup(group.id)}
                style={({ pressed }) => [styles.groupTrigger, pressed && styles.pressed]}
              >
                <View style={styles.groupInfo}>
                  <Text style={styles.groupName}>{group.name}</Text>
                  <Text style={styles.groupCount}>
                    {groupTags.length} tag{groupTags.length === 1 ? '' : 's'}
                  </Text>
                </View>
                <Ionicons
                  color={colors.mutedForeground}
                  name={open ? 'chevron-up' : 'chevron-down'}
                  size={20}
                />
              </Pressable>
              {open
                ? groupTags.map((tag) => (
                    <Pressable
                      key={tag.id}
                      accessibilityHint={`Edita a tag ${tag.name}`}
                      onPress={() => router.push(`/(app)/admin/tags/${tag.id}`)}
                      style={({ pressed }) => [styles.tag, pressed && styles.pressed]}
                    >
                      <View
                        style={[styles.color, { backgroundColor: tag.color || colors.mutedForeground }]}
                      />
                      <Text style={styles.tagName}>{tag.name}</Text>
                      <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
                    </Pressable>
                  ))
                : null}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

function State({ onPress, text }: { onPress?: () => void; text: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateText}>{text}</Text>
      {onPress ? (
        <Pressable onPress={onPress}>
          <Text style={styles.retry}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 18, padding: 24, paddingBottom: 40 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  description: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  group: { borderBottomColor: colors.border, borderBottomWidth: 1 },
  groupTrigger: { alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'space-between' as const, minHeight: 58 },
  groupInfo: { gap: 2 },
  groupName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  groupCount: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  tag: { alignItems: 'center' as const, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row' as const, gap: 12, marginLeft: 12, minHeight: 56, paddingLeft: 2 },
  color: { borderRadius: 8, height: 16, width: 16 },
  tagName: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 15 },
  state: { alignItems: 'center' as const, gap: 12, paddingVertical: 36 },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
  pressed: { opacity: 0.65 },
} as const;
