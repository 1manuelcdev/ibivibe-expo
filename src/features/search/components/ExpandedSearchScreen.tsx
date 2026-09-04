import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';

import { TextField } from '@/components/TextField';
import { useRecentSearchStore } from '@/features/search/stores/recent-search-store';
import { useSearchViewModel } from '@/features/search/viewmodels/useSearchViewModel';
import { colors } from '@/theme/tokens';

export function ExpandedSearchScreen() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const { normalizedQuery, search } = useSearchViewModel(debouncedQuery);
  const recentSearches = useRecentSearchStore((state) => state.searches);
  const addRecent = useRecentSearchStore((state) => state.add);
  const removeRecent = useRecentSearchStore((state) => state.remove);
  const clearRecent = useRecentSearchStore((state) => state.clear);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedQuery(query), 500);
    return () => clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    if (search.isSuccess && normalizedQuery.length >= 2) addRecent(normalizedQuery);
  }, [addRecent, normalizedQuery, search.isSuccess]);

  function chooseRecent(value: string) {
    setQuery(value);
    setDebouncedQuery(value);
  }

  const hasResults =
    search.data &&
    search.data.cities.length + search.data.businesses.length + search.data.events.length > 0;

  return (
    <View style={styles.screen}>
      <View style={styles.searchBar}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
        <TextField
          autoFocus
          containerStyle={styles.searchInputContainer}
          inputStyle={styles.input}
          onChangeText={setQuery}
          placeholder="O que vamos fazer hoje na Ibiapaba?"
          value={query}
        />
        {query.length > 0 && (
          <Pressable onPress={() => setQuery('')}>
            <Ionicons color={colors.mutedForeground} name="close-circle" size={20} />
          </Pressable>
        )}
      </View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {normalizedQuery.length < 2 ? (
          <RecentSearches
            clear={clearRecent}
            onRemove={removeRecent}
            onSelect={chooseRecent}
            searches={recentSearches}
          />
        ) : search.isLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : search.isError ? (
          <EmptyState icon="alert-circle-outline" text="Ocorreu um erro ao buscar resultados." />
        ) : hasResults ? (
          <Results data={search.data} />
        ) : (
          <EmptyState
            icon="search-outline"
            text={`Nenhum resultado encontrado para "${normalizedQuery}"`}
          />
        )}
      </ScrollView>
    </View>
  );
}

function RecentSearches({
  clear,
  onRemove,
  onSelect,
  searches,
}: {
  clear: () => void;
  onRemove: (query: string) => void;
  onSelect: (query: string) => void;
  searches: string[];
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Pesquisas recentes</Text>
        {searches.length > 0 && (
          <Pressable onPress={clear}>
            <Text style={styles.clear}>Limpar todas</Text>
          </Pressable>
        )}
      </View>
      {searches.length === 0 ? (
        <Text style={styles.muted}>Nenhuma pesquisa recente</Text>
      ) : (
        searches.map((item) => (
          <View key={item} style={styles.recentRow}>
            <Pressable onPress={() => onSelect(item)} style={styles.recentPressable}>
              <Ionicons color={colors.mutedForeground} name="time-outline" size={20} />
              <Text style={styles.recentText}>{item}</Text>
            </Pressable>
            <Pressable onPress={() => onRemove(item)}>
              <Ionicons color={colors.mutedForeground} name="close" size={20} />
            </Pressable>
          </View>
        ))
      )}
      <View style={styles.divider} />
      <Text style={styles.sectionTitle}>Sugestões</Text>
      <Text style={styles.muted}>
        Estamos trabalhando para trazer sugestões inteligentes para você.
      </Text>
    </View>
  );
}

function Results({
  data,
}: {
  data: NonNullable<ReturnType<typeof useSearchViewModel>['search']['data']>;
}) {
  return (
    <View style={styles.section}>
      <ResultGroup
        icon="location-outline"
        title="Cidades"
        items={data.cities.map((item) => item.name)}
      />
      <ResultGroup
        icon="briefcase-outline"
        title="Empresas"
        items={data.businesses.map((item) => item.name ?? item.commercial_name ?? 'Empresa')}
      />
      <ResultGroup
        icon="calendar-outline"
        title="Eventos"
        items={data.events.map((item) => item.name)}
      />
    </View>
  );
}

function ResultGroup({
  icon,
  items,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  items: string[];
  title: string;
}) {
  if (items.length === 0) return null;
  return (
    <View style={styles.resultGroup}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <View key={item} style={styles.resultRow}>
          <Ionicons color={colors.mutedForeground} name={icon} size={20} />
          <Text style={styles.recentText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function EmptyState({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons color={colors.mutedForeground} name={icon} size={48} />
      <Text style={styles.muted}>{text}</Text>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  searchBar: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    flexDirection: 'row' as const,
    gap: 12,
    padding: 16,
  },
  searchInputContainer: { flex: 1 },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    borderRadius: 12,
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    height: 44,
  },
  content: { padding: 16 },
  section: { gap: 12 },
  sectionHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sectionTitle: { color: colors.mutedForeground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  clear: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 13 },
  muted: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 20,
  },
  recentRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  recentPressable: {
    alignItems: 'center' as const,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
  },
  recentText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Regular', fontSize: 15 },
  divider: { backgroundColor: colors.border, height: 1, marginVertical: 12 },
  resultGroup: { gap: 8, marginBottom: 12 },
  resultRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    paddingVertical: 8,
  },
  empty: { alignItems: 'center' as const, gap: 16, justifyContent: 'center' as const, padding: 32 },
} as const;
