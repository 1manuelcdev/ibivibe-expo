import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { TextField } from '@/components/TextField';
import { useRecentSearchStore } from '@/features/search/stores/recent-search-store';
import { useSearchViewModel } from '@/features/search/viewmodels/useSearchViewModel';
import { colors } from '@/theme/tokens';

export function ExpandedSearchScreen() {
  const { query: initialQuery } = useLocalSearchParams<{ query?: string }>();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery ?? '');
  const { normalizedQuery, search } = useSearchViewModel(debouncedQuery);
  const recentSearches = useRecentSearchStore((state) => state.searches);
  const addRecent = useRecentSearchStore((state) => state.add);
  const removeRecent = useRecentSearchStore((state) => state.remove);

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
      <Animated.View entering={FadeIn.duration(180)} style={styles.searchBar}>
        <TextField
          autoFocus
          containerStyle={styles.searchInputContainer}
          inputStyle={styles.input}
          onChangeText={setQuery}
          placeholder="Pesquise cidades, empresas e eventos"
          returnKeyType="search"
          value={query}
        />
      </Animated.View>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {normalizedQuery.length < 2 ? (
          <Animated.View entering={FadeInDown.delay(60).duration(180)}>
            <RecentSearches
              onRemove={removeRecent}
              onSelect={chooseRecent}
              searches={recentSearches}
            />
          </Animated.View>
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
  onRemove,
  onSelect,
  searches,
}: {
  onRemove: (query: string) => void;
  onSelect: (query: string) => void;
  searches: string[];
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Últimas buscas</Text>
      {searches.length === 0 ? (
        <Text style={styles.muted}>Suas buscas recentes aparecerão aqui.</Text>
      ) : (
        searches.map((item) => (
          <View key={item} style={styles.recentRow}>
            <Pressable onPress={() => onSelect(item)} style={styles.recentPressable}>
              <Text style={styles.recentText}>{item}</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Remover ${item}`}
              hitSlop={8}
              onPress={() => onRemove(item)}
            >
              <Ionicons color={colors.foreground} name="close" size={16} />
            </Pressable>
          </View>
        ))
      )}
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
        kind="city"
        title="Cidades"
        items={data.cities.map((item) => ({
          description: item.description,
          id: item.id,
          image: item.cover_img_url,
          title: item.name,
        }))}
      />
      <ResultGroup
        kind="business"
        title="Empresas"
        items={data.businesses.map((item) => ({
          description: item.bio,
          id: item.id,
          image: item.avatar_url,
          title: item.name ?? item.commercial_name ?? 'Empresa',
        }))}
      />
      <ResultGroup
        kind="event"
        title="Eventos"
        items={data.events.map((item) => ({
          description: item.description,
          id: item.id,
          image: item.cover_img_url,
          title: item.name,
        }))}
      />
    </View>
  );
}

function ResultGroup({
  items,
  kind,
  title,
}: {
  items: Array<{ description?: string | null; id: string; image?: string | null; title: string }>;
  kind: 'business' | 'city' | 'event';
  title: string;
}) {
  const router = useRouter();
  if (items.length === 0) return null;
  return (
    <View style={styles.resultGroup}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {items.map((item) => (
        <Pressable
          key={item.id}
          onPress={() => router.push(`/(app)/${resultRoutes[kind]}/${item.id}`)}
          style={styles.resultRow}
        >
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.resultImage} />
          ) : (
            <View style={styles.resultImageFallback}>
              <Ionicons color={colors.mutedForeground} name={resultIcons[kind]} size={24} />
            </View>
          )}
          <View style={styles.resultCopy}>
            <Text numberOfLines={1} style={styles.resultTitle}>
              {item.title}
            </Text>
            {item.description ? (
              <Text numberOfLines={1} style={styles.resultDescription}>
                {item.description}
              </Text>
            ) : null}
          </View>
          <Ionicons color={colors.mutedForeground} name="chevron-forward" size={22} />
        </Pressable>
      ))}
    </View>
  );
}

const resultIcons = {
  business: 'briefcase-outline',
  city: 'location-outline',
  event: 'calendar-outline',
} as const;

const resultRoutes = {
  business: 'businesses',
  city: 'cities',
  event: 'events',
} as const;

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
    backgroundColor: colors.background,
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputContainer: { flex: 1, minWidth: 0 },
  input: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    color: colors.foreground,
    width: '100%',
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    height: 48,
  },
  content: { flexGrow: 1, paddingBottom: 32, paddingHorizontal: 16, paddingTop: 24 },
  section: { gap: 24 },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  muted: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  recentRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 16,
  },
  recentPressable: {
    alignItems: 'center' as const,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
  },
  recentText: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Regular', fontSize: 16 },
  resultGroup: { gap: 12, marginBottom: 12 },
  resultRow: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 8,
  },
  resultImage: { borderRadius: 8, height: 56, width: 56 },
  resultImageFallback: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    borderRadius: 8,
    height: 56,
    justifyContent: 'center' as const,
    width: 56,
  },
  resultCopy: { flex: 1, gap: 3 },
  resultTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  resultDescription: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  empty: {
    alignItems: 'center' as const,
    gap: 16,
    justifyContent: 'center' as const,
    paddingTop: 72,
  },
} as const;
