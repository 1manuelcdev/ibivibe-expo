import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { Toast, type ToastVariant } from '@/components/Toast';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi, type AdminTag, type TagTargetType } from '@/features/admin/admin-api';
import { AdminEditorSkeleton } from '@/features/admin/components/AdminSkeleton';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

type FormState = {
  color: string;
  description: string;
  groupId: string;
  name: string;
  position: string;
  targets: TagTargetType[];
};

const targetOptions: Array<{ label: string; value: TagTargetType }> = [
  { label: 'Cidades', value: 'city' },
  { label: 'Empresas', value: 'business' },
  { label: 'Eventos', value: 'event' },
];

export function AdminTagEditorScreen({ create = false }: { create?: boolean }) {
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  const account = useSessionStore((state) => state.account);
  const groups = useQuery({ queryFn: adminApi.getTagGroups, queryKey: ['admin', 'tag-groups'] });
  const tag = useQuery({
    enabled: !create && Boolean(tagId),
    queryFn: () => adminApi.getTag(tagId),
    queryKey: ['admin', 'tags', tagId],
  });

  if (!isAdminAccount(account)) return null;
  if (groups.isLoading || (!create && tag.isLoading)) return <AdminEditorSkeleton variant="tag" />;
  if (groups.isError || (!create && tag.isError) || (!create && !tag.data)) {
    return <EditorState error onRetry={() => void Promise.all([groups.refetch(), tag.refetch()])} />;
  }

  return <TagForm create={create} groups={groups.data ?? []} key={tag.data?.id ?? 'new'} tag={tag.data} />;
}

function TagForm({
  create,
  groups,
  tag,
}: {
  create: boolean;
  groups: Awaited<ReturnType<typeof adminApi.getTagGroups>>;
  tag?: AdminTag;
}) {
  const deletionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const queryClient = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => formFromTag(tag));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [groupsVisible, setGroupsVisible] = useState(false);
  const [pendingDeletion, setPendingDeletion] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastVariant, setToastVariant] = useState<ToastVariant>('info');
  const selectedGroup = groups.find((group) => group.id === form.groupId);
  const save = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const position = Number(form.position);
      if (!name) throw new Error('Informe o nome da tag.');
      if (!form.groupId) throw new Error('Selecione o grupo da tag.');
      if (!Number.isInteger(position) || position < 0)
        throw new Error('A posição deve ser um número inteiro igual ou maior que zero.');
      const base = { group_id: form.groupId, name, position, target_types: form.targets };

      if (create) {
        await adminApi.createTag({
          ...base,
          color: form.color.trim() || undefined,
          description: form.description.trim() || undefined,
        });
      } else if (tag) {
        await adminApi.updateTag(tag.id, {
          ...base,
          color: form.color.trim() || null,
          description: form.description.trim() || null,
        });
      }
    },
    onError: (error) =>
      Alert.alert(`Não foi possível ${create ? 'criar' : 'salvar'} a tag`, getApiErrorMessage(error)),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin', 'tag-groups'] }),
        queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] }),
      ]);
      router.dismissTo('/(app)/admin/tags');
    },
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteTag(tag!.id),
    onError: (error) => {
      setToastVariant('destructive');
      setToastMessage(getApiErrorMessage(error));
      setToastTimer();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tag-groups'] });
      router.dismissTo('/(app)/admin/tags');
    },
  });
  useEffect(
    () => () => {
      if (deletionTimer.current) clearTimeout(deletionTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );
  const updateField = (field: Exclude<keyof FormState, 'targets'>, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));
  const toggleTarget = (target: TagTargetType) =>
    setForm((current) => ({
      ...current,
      targets: current.targets.includes(target)
        ? current.targets.filter((item) => item !== target)
        : [...current.targets, target],
    }));
  function setToastTimer() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }
  function dismissToast() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(null);
  }
  function scheduleDeletion() {
    if (!tag) return;
    if (deletionTimer.current) clearTimeout(deletionTimer.current);
    setConfirmDelete(false);
    setPendingDeletion(true);
    setToastVariant('destructive');
    setToastMessage('Tag será excluída.');
    deletionTimer.current = setTimeout(() => {
      setPendingDeletion(false);
      setToastMessage('Excluindo tag...');
      remove.mutate();
    }, 5000);
  }
  function undoDeletion() {
    if (!pendingDeletion) return;
    if (deletionTimer.current) clearTimeout(deletionTimer.current);
    setPendingDeletion(false);
    setToastVariant('info');
    setToastMessage('Exclusão desfeita.');
    setToastTimer();
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppBackButton fallbackHref="/(app)/admin/tags" />
          <Text style={styles.title}>{create ? 'Nova tag' : 'Editar tag'}</Text>
          {!create ? (
            <Pressable accessibilityLabel="Excluir tag" hitSlop={8} onPress={() => setConfirmDelete(true)}>
              <Ionicons color="#FCA5A5" name="trash-outline" size={21} />
            </Pressable>
          ) : null}
        </View>
        <TextField label="Nome" onChangeText={(value) => updateField('name', value)} required value={form.name} />
        <Pressable onPress={() => setGroupsVisible(true)} style={styles.groupPicker}>
          <Text style={styles.groupLabel}>Grupo *</Text>
          <Text style={selectedGroup ? styles.groupValue : styles.groupPlaceholder}>
            {selectedGroup?.name ?? 'Selecionar grupo'}
          </Text>
        </Pressable>
        <TextField inputStyle={styles.descriptionInput} label="Descrição" multiline onChangeText={(value) => updateField('description', value)} placeholder="Descreva a tag" textAlignVertical="top" value={form.description} />
        <TextField autoCapitalize="none" label="Cor" onChangeText={(value) => updateField('color', value)} placeholder="#9FFF8B" value={form.color} />
        <TextField keyboardType="number-pad" label="Posição" onChangeText={(value) => updateField('position', value)} value={form.position} />
        <View style={styles.targets}>
          <Text style={styles.targetLabel}>Aplicações</Text>
          <View style={styles.targetOptions}>
            {targetOptions.map((option) => {
              const selected = form.targets.includes(option.value);
              return (
                <Pressable key={option.value} accessibilityRole="checkbox" accessibilityState={{ checked: selected }} onPress={() => toggleTarget(option.value)} style={[styles.targetOption, selected && styles.targetOptionSelected]}>
                  <Text style={[styles.targetText, selected && styles.targetTextSelected]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable disabled={save.isPending || !form.name.trim()} onPress={() => save.mutate()} style={[styles.saveButton, (save.isPending || !form.name.trim()) && styles.disabled]}>
          <Text style={styles.saveLabel}>{save.isPending ? 'Salvando…' : create ? 'Criar tag' : 'Salvar alterações'}</Text>
        </Pressable>
      </View>
      <ActionModal onClose={() => setGroupsVisible(false)} title="Selecionar grupo" visible={groupsVisible}>
        {groups.map((group) => (
          <ActionModalItem key={group.id} icon="folder-outline" onPress={() => { updateField('groupId', group.id); setGroupsVisible(false); }} title={group.name} />
        ))}
      </ActionModal>
      <ActionModal description="Essa ação não pode ser desfeita." onClose={() => setConfirmDelete(false)} title="Excluir tag?" visible={confirmDelete}>
        <ActionModalItem destructive disabled={remove.isPending} icon="trash-outline" onPress={scheduleDeletion} title="Excluir tag" />
      </ActionModal>
      <Toast actionLabel={pendingDeletion ? 'Desfazer' : undefined} duration={pendingDeletion ? 5000 : 3000} message={toastMessage ?? ''} onAction={undoDeletion} onDismiss={dismissToast} showProgress={pendingDeletion} variant={toastVariant} visible={Boolean(toastMessage)} />
    </View>
  );
}

function formFromTag(tag?: AdminTag): FormState {
  return { color: tag?.color ?? '', description: tag?.description ?? '', groupId: tag?.group_id ?? '', name: tag?.name ?? '', position: String(tag?.position ?? 0), targets: tag?.targets?.map((target) => target.target_type) ?? [] };
}

function EditorState({ error, onRetry }: { error?: boolean; onRetry?: () => void }) {
  return <View style={styles.state}><Text style={styles.stateText}>Não foi possível carregar a tag.</Text>{error && onRetry ? <Pressable onPress={onRetry}><Text style={styles.retry}>Tentar novamente</Text></Pressable> : null}</View>;
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 }, content: { gap: 20, padding: 24, paddingBottom: 112 }, header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 }, title: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  groupPicker: { backgroundColor: '#27272A', borderColor: colors.border, borderRadius: 12, borderWidth: 1, gap: 6, minHeight: 62, paddingHorizontal: 16, paddingVertical: 10 }, groupLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 }, groupValue: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14 }, groupPlaceholder: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 }, descriptionInput: { height: 112, paddingTop: 12 },
  targets: { gap: 8 }, targetLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 }, targetOptions: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 }, targetOption: { backgroundColor: '#27272A', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 }, targetOptionSelected: { backgroundColor: colors.primary }, targetText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 13 }, targetTextSelected: { color: colors.primaryForeground },
  footer: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, padding: 16, position: 'absolute' as const, right: 0 }, saveButton: { alignItems: 'center' as const, backgroundColor: colors.primary, borderRadius: 24, height: 48, justifyContent: 'center' as const }, saveLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 15 }, disabled: { opacity: 0.5 }, state: { alignItems: 'center' as const, backgroundColor: colors.background, flex: 1, gap: 12, justifyContent: 'center' as const, padding: 24 }, stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 }, retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
} as const;
