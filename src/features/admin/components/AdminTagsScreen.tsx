import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { AppBackButton } from '@/components/AppBackButton';
import { TextField } from '@/components/TextField';
import { isAdminAccount } from '@/features/admin/admin-access';
import { adminApi } from '@/features/admin/admin-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function AdminTagsScreen() {
  const account = useSessionStore((state) => state.account);
  const router = useRouter();
  const [search, setSearch] = useState('');
  const tags = useQuery({ queryFn: adminApi.getTags, queryKey: ['admin', 'tags'] });
  const visibleTags = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('pt-BR');
    if (!term) return tags.data ?? [];
    return (tags.data ?? []).filter((tag) =>
      [tag.name, tag.group?.name].some((value) => value?.toLocaleLowerCase('pt-BR').includes(term)),
    );
  }, [search, tags.data]);

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
        {!tags.isLoading && !tags.isError && !visibleTags.length ? (
          <State text={search ? 'Nenhuma tag encontrada.' : 'Nenhuma tag disponível.'} />
        ) : null}
        {visibleTags.map((tag) => (
          <Pressable
            key={tag.id}
            accessibilityHint={`Edita a tag ${tag.name}`}
            onPress={() => router.push(`/(app)/admin/tags/${tag.id}`)}
            style={({ pressed }) => [styles.tag, pressed && styles.pressed]}
          >
            <View style={[styles.color, { backgroundColor: tag.color || colors.mutedForeground }]} />
            <View style={styles.tagInfo}>
              <Text style={styles.tagName}>{tag.name}</Text>
              <Text style={styles.tagGroup}>{tag.group?.name ?? 'Sem grupo'}</Text>
            </View>
            <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
          </Pressable>
        ))}
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
  tag: { alignItems: 'center' as const, borderBottomColor: colors.border, borderBottomWidth: 1, flexDirection: 'row' as const, gap: 12, minHeight: 62 },
  color: { borderRadius: 8, height: 16, width: 16 },
  tagInfo: { flex: 1, gap: 3 },
  tagName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  tagGroup: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  state: { alignItems: 'center' as const, gap: 12, paddingVertical: 36 },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
  pressed: { opacity: 0.65 },
} as const;
