import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi, type AdminTag } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

type FormState = {
  color: string;
  description: string;
  name: string;
  position: string;
};

export function AdminTagEditorScreen() {
  const { tagId } = useLocalSearchParams<{ tagId: string }>();
  const account = useSessionStore((state) => state.account);
  const tags = useQuery({ queryFn: adminApi.getTags, queryKey: ['admin', 'tags'] });
  const tag = tags.data?.find((item) => item.id === tagId);

  if (!isAdminAccount(account)) return null;
  if (tags.isLoading) return <EditorState loading />;
  if (tags.isError || !tag) return <EditorState error onRetry={() => tags.refetch()} />;

  return <TagEditorForm key={tag.id} tag={tag} />;
}

function TagEditorForm({ tag }: { tag: AdminTag }) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() => formFromTag(tag));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const save = useMutation({
    mutationFn: async () => {
      const name = form.name.trim();
      const position = Number(form.position);
      if (!name) throw new Error('Informe o nome da tag.');
      if (!Number.isInteger(position) || position < 0)
        throw new Error('A posição deve ser um número inteiro igual ou maior que zero.');

      await adminApi.updateTag(tag.id, {
        color: form.color.trim() || undefined,
        description: form.description.trim() || undefined,
        name,
        position,
      });
    },
    onError: (error) => Alert.alert('Não foi possível salvar a tag', getApiErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      router.dismissTo('/(app)/admin/tags');
    },
  });
  const remove = useMutation({
    mutationFn: () => adminApi.deleteTag(tag.id),
    onError: (error) => Alert.alert('Não foi possível excluir a tag', getApiErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin', 'tags'] });
      router.dismissTo('/(app)/admin/tags');
    },
  });
  const updateField = (field: keyof FormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppBackButton fallbackHref="/(app)/admin/tags" />
          <Text style={styles.title}>Editar tag</Text>
          <Pressable accessibilityLabel="Excluir tag" hitSlop={8} onPress={() => setConfirmDelete(true)}>
            <Ionicons color="#FCA5A5" name="trash-outline" size={21} />
          </Pressable>
        </View>
        <View style={styles.group}>
          <Text style={styles.groupLabel}>Grupo</Text>
          <Text style={styles.groupValue}>{tag.group?.name ?? 'Sem grupo'}</Text>
        </View>
        <TextField label="Nome" onChangeText={(value) => updateField('name', value)} required value={form.name} />
        <TextField
          inputStyle={styles.descriptionInput}
          label="Descrição"
          multiline
          onChangeText={(value) => updateField('description', value)}
          placeholder="Descreva a tag"
          textAlignVertical="top"
          value={form.description}
        />
        <TextField
          autoCapitalize="none"
          label="Cor"
          onChangeText={(value) => updateField('color', value)}
          placeholder="#9FFF8B"
          value={form.color}
        />
        <TextField
          keyboardType="number-pad"
          label="Posição"
          onChangeText={(value) => updateField('position', value)}
          value={form.position}
        />
        <Text style={styles.hint}>
          O grupo e as aplicações da tag não podem ser alterados por este contrato.
        </Text>
      </ScrollView>
      <View style={styles.footer}>
        <Pressable
          disabled={save.isPending || !form.name.trim()}
          onPress={() => save.mutate()}
          style={[styles.saveButton, (save.isPending || !form.name.trim()) && styles.disabled]}
        >
          <Text style={styles.saveLabel}>{save.isPending ? 'Salvando…' : 'Salvar alterações'}</Text>
        </Pressable>
      </View>
      <ActionModal
        description="Essa ação não pode ser desfeita."
        onClose={() => setConfirmDelete(false)}
        title="Excluir tag?"
        visible={confirmDelete}
      >
        <ActionModalItem
          destructive
          disabled={remove.isPending}
          icon="trash-outline"
          onPress={() => remove.mutate()}
          title={remove.isPending ? 'Excluindo…' : 'Excluir tag'}
        />
      </ActionModal>
    </View>
  );
}

function formFromTag(tag: AdminTag): FormState {
  return {
    color: tag.color ?? '',
    description: tag.description ?? '',
    name: tag.name,
    position: String(tag.position ?? 0),
  };
}

function EditorState({ error, loading, onRetry }: { error?: boolean; loading?: boolean; onRetry?: () => void }) {
  return (
    <View style={styles.state}>
      {loading ? <ActivityIndicator color={colors.primary} /> : <Text style={styles.stateText}>Não foi possível carregar a tag.</Text>}
      {error && onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.retry}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 20, padding: 24, paddingBottom: 112 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 16 },
  title: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  group: { backgroundColor: '#18181B', borderRadius: 12, gap: 3, padding: 14 },
  groupLabel: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  groupValue: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 15 },
  descriptionInput: { height: 112, paddingTop: 12 },
  hint: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 18 },
  footer: { backgroundColor: colors.background, borderTopColor: colors.border, borderTopWidth: 1, bottom: 0, left: 0, padding: 16, position: 'absolute' as const, right: 0 },
  saveButton: { alignItems: 'center' as const, backgroundColor: colors.primary, borderRadius: 24, height: 48, justifyContent: 'center' as const },
  saveLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 15 },
  disabled: { opacity: 0.5 },
  state: { alignItems: 'center' as const, backgroundColor: colors.background, flex: 1, gap: 12, justifyContent: 'center' as const, padding: 24 },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
} as const;
