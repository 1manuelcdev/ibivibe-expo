import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi, type AdminTagGroup } from '@/features/admin/admin-api';
import { AdminEditorSkeleton } from '@/features/admin/components/AdminSkeleton';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AdminTagGroupEditorScreen({ create = false }: { create?: boolean }) {
  const { groupId } = useLocalSearchParams<{ groupId: string }>();
  const account = useSessionStore((state) => state.account);
  const groups = useQuery({ queryFn: adminApi.getTagGroups, queryKey: ['admin', 'tag-groups'] });
  const group = groups.data?.find((item) => item.id === groupId);
  if (!isAdminAccount(account)) return null;
  if (groups.isLoading) return <AdminEditorSkeleton variant="group" />;
  if (groups.isError || (!create && !group)) return <State error onRetry={() => groups.refetch()} />;
  return <GroupForm create={create} group={group} key={group?.id ?? 'new'} />;
}

function GroupForm({ create, group }: { create: boolean; group?: AdminTagGroup }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [name, setName] = useState(group?.name ?? '');
  const [description, setDescription] = useState(group?.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useMutation({
    mutationFn: () => {
      if (!name.trim()) throw new Error('Informe o nome do grupo.');
      return create ? adminApi.createTagGroup({ name: name.trim(), description: description.trim() || undefined }) : adminApi.updateTagGroup(group!.id, { name: name.trim(), description: description.trim() || null });
    },
    onError: (error) => Alert.alert(`Não foi possível ${create ? 'criar' : 'salvar'} o grupo`, getApiErrorMessage(error)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'tag-groups'] }); router.dismissTo('/(app)/admin/tags'); },
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteTagGroup(group!.id),
    onError: (error) => Alert.alert('Não foi possível excluir o grupo', getApiErrorMessage(error)),
    onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['admin', 'tag-groups'] }); router.dismissTo('/(app)/admin/tags'); },
  });
  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}><View style={styles.header}><AppBackButton fallbackHref="/(app)/admin/tags" /><Text style={styles.title}>{create ? 'Novo grupo' : 'Editar grupo'}</Text>{!create ? <Pressable accessibilityLabel="Excluir grupo" hitSlop={8} onPress={() => setConfirmDelete(true)}><Ionicons color="#FCA5A5" name="trash-outline" size={21} /></Pressable> : null}</View><TextField label="Nome" onChangeText={setName} required value={name} /><TextField inputStyle={styles.descriptionInput} label="Descrição" multiline onChangeText={setDescription} placeholder="Descreva o grupo" textAlignVertical="top" value={description} /></ScrollView><View style={styles.footer}><Pressable disabled={save.isPending || !name.trim()} onPress={() => save.mutate()} style={[styles.saveButton, (save.isPending || !name.trim()) && styles.disabled]}><Text style={styles.saveLabel}>{save.isPending ? 'Salvando…' : create ? 'Criar grupo' : 'Salvar alterações'}</Text></Pressable></View><ActionModal description="As tags deste grupo também serão removidas." onClose={() => setConfirmDelete(false)} title="Excluir grupo?" visible={confirmDelete}><ActionModalItem destructive disabled={remove.isPending} icon="trash-outline" onPress={() => remove.mutate()} title={remove.isPending ? 'Excluindo…' : 'Excluir grupo'} /></ActionModal></View>;
}

function State({ error, onRetry }: { error?: boolean; onRetry?: () => void }) { return <View style={styles.state}><Text style={styles.stateText}>Não foi possível carregar o grupo.</Text>{error && onRetry ? <Pressable onPress={onRetry}><Text style={styles.retry}>Tentar novamente</Text></Pressable> : null}</View>; }

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 }, content: { gap: 20, padding: 24, paddingBottom: 112 }, header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 }, title: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 20 }, descriptionInput: { height: 112, paddingTop: 12 }, footer: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, padding: 16, position: 'absolute' as const, right: 0 }, saveButton: { alignItems: 'center' as const, backgroundColor: colors.primary, borderRadius: 24, height: 48, justifyContent: 'center' as const }, saveLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 15 }, disabled: { opacity: 0.5 }, state: { alignItems: 'center' as const, backgroundColor: colors.background, flex: 1, gap: 12, justifyContent: 'center' as const, padding: 24 }, stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 }, retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
} as const;
