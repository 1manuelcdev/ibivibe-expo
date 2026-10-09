import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AdminTagsScreen() {
  const account = useSessionStore((state) => state.account);
  const router = useRouter();
  const [createVisible, setCreateVisible] = useState(false);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const groupsQuery = useQuery({ queryFn: adminApi.getTagGroups, queryKey: ['admin', 'tag-groups'] });
  const groups = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    return (groupsQuery.data ?? []).flatMap((group) => {
      const groupTags = (group.tags ?? []).filter(
        (tag) => !term || [tag.name, group.name].some((value) => value.toLocaleLowerCase('pt-BR').includes(term)),
      );
      return groupTags.length || !term ? [{ group, tags: groupTags }] : [];
    });
  }, [groupsQuery.data, search]);
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
          <Pressable accessibilityLabel="Criar grupo ou tag" hitSlop={8} onPress={() => setCreateVisible(true)}>
            <Ionicons color={colors.foreground} name="add" size={25} />
          </Pressable>
        </View>
        <Text style={styles.description}>
          Atualize as informações das tags já cadastradas.
        </Text>
        <TextField onChangeText={setSearch} placeholder="Buscar tag ou grupo" value={search} />
        {groupsQuery.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
        {groupsQuery.isError ? <State text="Não foi possível carregar as tags." onPress={() => groupsQuery.refetch()} /> : null}
        {!groupsQuery.isLoading && !groupsQuery.isError && !groups.length ? (
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
              <Pressable
                accessibilityLabel={`Editar grupo ${group.name}`}
                hitSlop={8}
                onPress={() => router.push(`/(app)/admin/tags/groups/${group.id}`)}
                style={styles.groupEdit}
              >
                <Ionicons color={colors.mutedForeground} name="create-outline" size={18} />
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
      <ActionModal
        onClose={() => setCreateVisible(false)}
        title="Criar no catálogo"
        visible={createVisible}
      >
        <ActionModalItem
          icon="folder-outline"
          onPress={() => {
            setCreateVisible(false);
            router.push('/(app)/admin/tags/groups/new');
          }}
          title="Novo grupo"
        />
        <ActionModalItem
          description="Selecione o grupo e as aplicações da tag."
          icon="pricetag-outline"
          onPress={() => {
            setCreateVisible(false);
            router.push('/(app)/admin/tags/new');
          }}
          title="Nova tag"
        />
      </ActionModal>
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
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  description: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  group: { borderBottomColor: colors.border, borderBottomWidth: 1, position: 'relative' as const },
  groupTrigger: { alignItems: 'center' as const, flexDirection: 'row' as const, justifyContent: 'space-between' as const, minHeight: 58, paddingRight: 34 },
  groupInfo: { gap: 2 },
  groupName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  groupCount: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  groupEdit: { alignItems: 'center' as const, height: 40, justifyContent: 'center' as const, position: 'absolute' as const, right: 28, top: 9, width: 28 },
  tag: { alignItems: 'center' as const, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row' as const, gap: 12, marginLeft: 12, minHeight: 56, paddingLeft: 2 },
  color: { borderRadius: 8, height: 16, width: 16 },
  tagName: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 15 },
  state: { alignItems: 'center' as const, gap: 12, paddingVertical: 36 },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
  pressed: { opacity: 0.65 },
} as const;
