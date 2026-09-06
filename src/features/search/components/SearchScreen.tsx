import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { homeApi } from '@/features/home/home-api';
import { onboardingApi } from '@/features/onboarding/onboarding-api';
import { getSuggestedCategories } from '@/features/search/search-suggestions';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';
import { useQuery } from '@tanstack/react-query';

type AccountInterests = { businesses?: string[]; events?: string[] };

export function SearchScreen() {
  const router = useRouter();
  const [isOpeningSearch, setIsOpeningSearch] = useState(false);
  const heroProgress = useSharedValue(0);
  const navigationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const account = useSessionStore((state) => state.account);
  const cities = useQuery({
    queryFn: homeApi.getCities,
    queryKey: ['search', 'cities'],
    staleTime: 60_000,
  });
  const tags = useQuery({
    queryFn: onboardingApi.getTags,
    queryKey: ['search', 'tags'],
    staleTime: 10 * 60_000,
  });
  const interests = (account as (typeof account & { interests?: AccountInterests }) | null)
    ?.interests;
  const businessCategories = useMemo(
    () => getSuggestedCategories('businesses', interests, tags.data),
    [interests, tags.data],
  );
  const eventCategories = useMemo(
    () => getSuggestedCategories('events', interests, tags.data),
    [interests, tags.data],
  );

  const heroStyle = useAnimatedStyle(() => ({
    opacity: withTiming(heroProgress.value ? 0.92 : 1, { duration: 180 }),
    transform: [
      {
        scale: withTiming(heroProgress.value ? 1.025 : 1, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        }),
      },
    ],
  }));

  useEffect(
    () => () => {
      if (navigationTimeout.current) clearTimeout(navigationTimeout.current);
    },
    [],
  );

  function openSearch(query?: string) {
    if (isOpeningSearch) return;
    setIsOpeningSearch(true);
    heroProgress.set(1);
    navigationTimeout.current = setTimeout(() => {
      router.push({ pathname: '/(app)/search/expanded', params: query ? { query } : {} });
      heroProgress.set(0);
      setIsOpeningSearch(false);
    }, 180);
  }

  return (
    <View style={styles.screen}>
      <Pressable
        accessibilityRole="search"
        disabled={isOpeningSearch}
        onPress={() => openSearch()}
        style={styles.header}
      >
        <Animated.View style={[styles.searchField, heroStyle]}>
          <Ionicons color={colors.mutedForeground} name="search-outline" size={18} />
          <Text style={styles.searchText}>Pesquise cidades, empresas e eventos</Text>
        </Animated.View>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <CategorySection categories={businessCategories} onPress={openSearch} title="Empresas" />
        <CategorySection categories={eventCategories} onPress={openSearch} title="Eventos" />
        <CitiesSection
          cities={cities.data ?? []}
          isLoading={cities.isLoading}
          onSeeAll={() => router.push('/(app)/cities')}
        />
      </ScrollView>
    </View>
  );
}

function CategorySection({
  categories,
  onPress,
  title,
}: {
  categories: string[];
  onPress: (query?: string) => void;
  title: string;
}) {
  return (
    <View style={styles.section}>
      <SectionHeader onSeeAll={() => onPress()} title={title} />
      <View style={styles.categoryGrid}>
        {categories.map((category) => (
          <Pressable key={category} onPress={() => onPress(category)} style={styles.categoryButton}>
            <Text style={styles.categoryLabel}>{category}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function CitiesSection({
  cities,
  isLoading,
  onSeeAll,
}: {
  cities: Array<{ cover_img_url?: string | null; id: string; name: string; tags?: string[] }>;
  isLoading: boolean;
  onSeeAll: () => void;
}) {
  const router = useRouter();
  return (
    <View style={styles.section}>
      <SectionHeader onSeeAll={onSeeAll} title="Explore as cidades da Ibiapaba" />
      {isLoading ? <View style={styles.citySkeleton} /> : null}
      {!isLoading && cities.length ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cityList}
        >
          {cities.slice(0, 5).map((city) => (
            <Pressable
              key={city.id}
              onPress={() => router.push(`/(app)/cities/${city.id}`)}
              style={styles.cityCard}
            >
              {city.cover_img_url ? (
                <Image source={{ uri: city.cover_img_url }} style={styles.cityImage} />
              ) : (
                <View style={styles.cityImageFallback}>
                  <Ionicons color={colors.mutedForeground} name="location-outline" size={28} />
                </View>
              )}
              <Text numberOfLines={1} style={styles.cityName}>
                {city.name}
              </Text>
              <View style={styles.badgeList}>
                <EntityTags tags={city.tags?.length ? city.tags : ['Ibiapaba']} />
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

function EntityTags({ tags }: { tags: string[] }) {
  const [firstTag, ...remainingTags] = tags;

  return (
    <>
      {firstTag ? (
        <View style={styles.badge}>
          <Text style={styles.badgeLabel}>{firstTag}</Text>
        </View>
      ) : null}
      {remainingTags.length ? (
        <Text style={styles.extraTags}>{`(+${remainingTags.length} tags)`}</Text>
      ) : null}
    </>
  );
}

function SectionHeader({ onSeeAll, title }: { onSeeAll: () => void; title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Pressable onPress={onSeeAll} hitSlop={8}>
        <Text style={styles.seeAll}>Ver tudo</Text>
      </Pressable>
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: { backgroundColor: '#27272A', paddingHorizontal: 16, paddingVertical: 16 },
  content: { gap: 28, paddingBottom: 32, paddingHorizontal: 16, paddingTop: 28 },
  searchField: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
  },
  searchText: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  section: { gap: 16 },
  sectionHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  seeAll: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  categoryGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 10 },
  categoryButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 16,
    flexBasis: '31%' as const,
    flexGrow: 1,
    height: 56,
    justifyContent: 'center' as const,
    paddingHorizontal: 8,
  },
  categoryLabel: {
    color: '#F4F4F5',
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    textAlign: 'center' as const,
  },
  cityList: { gap: 16 },
  cityCard: { gap: 6, padding: 8, width: 212 },
  cityImage: { borderRadius: 8, height: 100, width: 196 },
  cityImageFallback: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 8,
    height: 100,
    justifyContent: 'center' as const,
    width: 196,
  },
  cityName: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 14 },
  badgeList: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 4,
    overflow: 'hidden' as const,
  },
  badge: {
    backgroundColor: '#3F3F46',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 10 },
  extraTags: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 10 },
  citySkeleton: { backgroundColor: '#27272A', borderRadius: 16, height: 160, width: 212 },
} as const;
