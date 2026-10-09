import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { Toast, type ToastVariant } from '@/components/Toast';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi, type AdminTagGroup } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AdminTagsScreen() {
  const deletionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const account = useSessionStore((state) => state.account);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [createVisible, setCreateVisible] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<AdminTagGroup | null>(null);
  const [groupOptions, setGroupOptions] = useState<AdminTagGroup | null>(null);
  const [openGroups, setOpenGroups] = useState<string[]>([]);
  const [pendingDeletion, setPendingDeletion] = useState<AdminTagGroup | null>(null);
  const [search, setSearch] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');
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
  const removeGroup = useMutation({
    mutationFn: (groupId: string) => adminApi.deleteTagGroup(groupId),
    onError: (error) => {
      setToastVariant('destructive');
      setToastMessage(getApiErrorMessage(error));
      setToastTimer();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tag-groups'] });
      setToastVariant('success');
      setToastMessage('Grupo excluído.');
      setToastTimer();
    },
  });
  useEffect(
    () => () => {
      if (deletionTimer.current) clearTimeout(deletionTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const toggleGroup = (groupId: string) =>
    setOpenGroups((current) =>
      current.includes(groupId)
        ? current.filter((id) => id !== groupId)
        : [...current, groupId],
    );
  function setToastTimer() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }
  function dismissToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(null);
  }
  function scheduleDeletion(group: AdminTagGroup) {
    if (deletionTimer.current) clearTimeout(deletionTimer.current);
    setGroupToDelete(null);
    setPendingDeletion(group);
    setToastVariant('destructive');
    setToastMessage('Grupo será excluído.');
    deletionTimer.current = setTimeout(() => {
      setPendingDeletion(null);
      setToastMessage('Excluindo grupo...');
      removeGroup.mutate(group.id);
    }, 5000);
  }
  function undoDeletion() {
    if (!pendingDeletion) return;
    if (deletionTimer.current) clearTimeout(deletionTimer.current);
    setPendingDeletion(null);
    setToastVariant('info');
    setToastMessage('Exclusão desfeita.');
    setToastTimer();
  }

  if (!isAdminAccount(account)) return null;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <View style={styles.headerStart}>
            <AppBackButton fallbackHref="/(app)/admin" />
            <Text style={styles.title}>Editar tags</Text>
          </View>
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
                accessibilityLabel={`Opções de ${group.name}`}
                hitSlop={8}
                onPress={() => setGroupOptions(group)}
                style={styles.groupOptionsButton}
              >
                <Ionicons color={colors.foreground} name="ellipsis-horizontal" size={19} />
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
          style={styles.createFirstAction}
          title="Novo grupo"
        />
        <ActionModalItem
          description="Selecione o grupo e as aplicações da tag."
          icon="pricetag-outline"
          onPress={() => {
            setCreateVisible(false);
            router.push('/(app)/admin/tags/new');
          }}
          style={styles.createFollowingAction}
          title="Nova tag"
        />
      </ActionModal>
      <ActionModal
        onClose={() => setGroupOptions(null)}
        title={groupOptions?.name ?? 'Opções do grupo'}
        visible={Boolean(groupOptions)}
      >
        <ActionModalItem
          icon="create-outline"
          onPress={() => {
            if (!groupOptions) return;
            router.push(`/(app)/admin/tags/groups/${groupOptions.id}`);
            setGroupOptions(null);
          }}
          title="Editar grupo"
        />
        <ActionModalItem
          destructive
          icon="trash-outline"
          onPress={() => {
            setGroupToDelete(groupOptions);
            setGroupOptions(null);
          }}
          title="Excluir grupo"
        />
      </ActionModal>
      <ActionModal
        description="As tags deste grupo também serão removidas."
        onClose={() => setGroupToDelete(null)}
        title="Excluir grupo?"
        visible={Boolean(groupToDelete)}
      >
        <ActionModalItem
          destructive
          disabled={removeGroup.isPending}
          icon="trash-outline"
          onPress={() => groupToDelete && scheduleDeletion(groupToDelete)}
          title="Excluir grupo"
        />
      </ActionModal>
      <Toast
        actionLabel={pendingDeletion ? 'Desfazer' : undefined}
        duration={pendingDeletion ? 5000 : 3000}
        message={toastMessage ?? ''}
        onAction={undoDeletion}
        onDismiss={dismissToast}
        showProgress={Boolean(pendingDeletion)}
        variant={toastVariant}
        visible={Boolean(toastMessage)}
      />
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
  headerStart: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  description: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  group: { borderBottomColor: colors.border, borderBottomWidth: 1, position: 'relative' as const },
  groupTrigger: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 58,
    paddingRight: 48,
  },
  groupInfo: { gap: 2 },
  groupName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  groupCount: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  groupOptionsButton: {
    alignItems: 'center' as const,
    backgroundColor: 'transparent',
    height: 40,
    justifyContent: 'center' as const,
    position: 'absolute' as const,
    right: 0,
    top: 9,
    width: 32,
  },
  createFirstAction: { marginTop: 14 },
  createFollowingAction: { marginTop: 8 },
  tag: { alignItems: 'center' as const, borderTopColor: colors.border, borderTopWidth: 1, flexDirection: 'row' as const, gap: 12, marginLeft: 12, minHeight: 56, paddingLeft: 2 },
  color: { borderRadius: 8, height: 16, width: 16 },
  tagName: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 15 },
  state: { alignItems: 'center' as const, gap: 12, paddingVertical: 36 },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
  pressed: { opacity: 0.65 },
} as const;
