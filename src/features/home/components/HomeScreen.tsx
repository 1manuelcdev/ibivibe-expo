import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  type ImageStyle,
  Pressable,
  RefreshControl,
  ScrollView,
  type StyleProp,
  Text,
  useWindowDimensions,
  type ViewStyle,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { EventCard } from '@/components/EventCard';
import { TagBadges } from '@/components/TagBadges';
import { LocationSheet } from '@/features/home/components/LocationSheet';
import type { HomeCity } from '@/features/home/models/home-types';
import { useHomeViewModel } from '@/features/home/viewmodels/useHomeViewModel';
import { useEntityCoverUrls } from '@/features/medias/useEntityCoverUrls';
import { colors, radius } from '@/theme/tokens';
import { normalizeImageUrl } from '@/utils/normalize-image-url';

const categories = [
  'Restaurantes',
  'Hotéis e Pousadas',
  'Postos de Gasolina',
  'Banhos',
  'Comércio',
  'Aventura',
];

const carouselDuration = 7000;

const fallbackImages = {
  business: 'briefcase-outline' as const,
  city: 'location-outline' as const,
};

export function HomeScreen() {
  const router = useRouter();
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCity, setSelectedCity] = useState<HomeCity | null>(null);
  const {
    businesses: businessesQuery,
    cities: citiesQuery,
    events: eventsQuery,
  } = useHomeViewModel();
  const cityCoverUrls = useEntityCoverUrls('city', citiesQuery.data?.map((city) => city.id) ?? []);
  const eventItems = eventsQuery.data?.slice(0, 3).map((event) => ({
    id: event.id,
    title: event.name,
    date: formatEventDate(event.start_date, event.end_date),
    tags: event.tags?.slice(0, 3).map((tag) => tag.name) ?? ['Evento'],
    image: event.medias?.find((media) => media.is_cover)?.url,
  }));
  const businessItems = businessesQuery.data?.slice(0, 5).map((business) => ({
    id: business.id,
    title: business.name ?? business.commercial_name ?? 'Empresa',
    tags: business.tags?.slice(0, 2) ?? ['Negócio local'],
    image: business.avatar_url,
  }));
  const cityItems = citiesQuery.data?.slice(0, 5).map((city) => ({
    id: city.id,
    title: city.name,
    tags: city.tags?.slice(0, 2) ?? ['Ibiapaba'],
    image: cityCoverUrls.get(city.id),
  }));
  const refreshHome = async () => {
    setRefreshing(true);
    try {
      await Promise.all([businessesQuery.refetch(), citiesQuery.refetch(), eventsQuery.refetch()]);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={() => void refreshHome()}
            progressBackgroundColor="#18181B"
            refreshing={refreshing}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        <HomeHeader
          city={selectedCity?.name ?? 'Toda a Ibiapaba'}
          onLocationPress={() => setLocationSheetVisible(true)}
        />
        <Pressable
          onPress={() => router.push('/(app)/search/expanded')}
          style={styles.searchButton}
        >
          <Ionicons color={colors.mutedForeground} name="search-outline" size={20} />
          <Text style={styles.searchText}>O que vamos fazer hoje na Ibiapaba?</Text>
        </Pressable>
        <SponsoredHighlights cities={citiesQuery.data ?? []} />
        <Categories />
        <Section title="Eventos acontecendo perto" onSeeAll={() => router.push('/(app)/events')}>
          <HomeSectionState query={eventsQuery} emptyText="Nenhum evento disponível agora.">
            <HorizontalCards gap={20}>
              {eventItems?.map((event) => (
                <EventCard
                  key={event.id}
                  {...event}
                  onPress={() =>
                    router.push({
                      params: { id: event.id, origin: 'home' },
                      pathname: '/(app)/events/[id]',
                    })
                  }
                />
              ))}
            </HorizontalCards>
          </HomeSectionState>
        </Section>
        <Section
          title="Explore as empresas da Ibiapaba"
          onSeeAll={() => router.push('/(app)/businesses')}
        >
          <HomeSectionState query={businessesQuery} emptyText="Nenhuma empresa disponível agora.">
            <HorizontalCards>
              {businessItems?.map((business) => (
                <BusinessCard
                  key={business.id}
                  {...business}
                  onPress={() => router.push(`/(app)/businesses/${business.id}`)}
                />
              ))}
            </HorizontalCards>
          </HomeSectionState>
        </Section>
        <Section
          title="Explore as cidades da Ibiapaba"
          onSeeAll={() => router.push('/(app)/cities')}
        >
          <HomeSectionState query={citiesQuery} emptyText="Nenhuma cidade disponível agora.">
            <HorizontalCards>
              {cityItems?.map((city) => (
                <CityCard
                  key={city.id}
                  {...city}
                  onPress={() => router.push(`/(app)/cities/${city.id}`)}
                />
              ))}
            </HorizontalCards>
          </HomeSectionState>
        </Section>
      </ScrollView>
      <LocationSheet
        cities={citiesQuery.data ?? []}
        error={citiesQuery.isError}
        isLoading={citiesQuery.isLoading}
        onClose={() => setLocationSheetVisible(false)}
        onRetry={() => citiesQuery.refetch()}
        onSelect={(city) => {
          setSelectedCity(city);
          setLocationSheetVisible(false);
        }}
        selectedCityId={selectedCity?.id ?? null}
        visible={locationSheetVisible}
      />
    </View>
  );
}

function HomeHeader({ city, onLocationPress }: { city: string; onLocationPress: () => void }) {
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable onPress={onLocationPress} style={styles.cityButton}>
        <Text numberOfLines={1} style={styles.cityName}>
          {city}
        </Text>
        <Ionicons color={colors.foreground} name="chevron-down" size={18} />
      </Pressable>
      <Pressable
        accessibilityLabel="Conta"
        onPress={() => router.push('/(app)/accounts')}
        style={styles.notificationButton}
      >
        <Ionicons color={colors.foreground} name="person-circle-outline" size={26} />
      </Pressable>
    </View>
  );
}

function SponsoredHighlights({ cities }: { cities: HomeCity[] }) {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);
  const progress = useSharedValue(0);
  const { width } = useWindowDimensions();
  const carouselWidth = width - 32;
  const items = cities.slice(0, 5);
  const cityCoverUrls = useEntityCoverUrls(
    'city',
    items.map((city) => city.id),
  );
  const currentIndex = Math.min(activeIndex, Math.max(items.length - 1, 0));

  useEffect(() => {
    progress.set(0);
    if (isInteracting || items.length < 2) return;

    progress.set(withTiming(1, { duration: carouselDuration, easing: Easing.linear }));

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % items.length;
      scrollViewRef.current?.scrollTo({
        animated: true,
        x: nextIndex * carouselWidth,
      });
      setActiveIndex(nextIndex);
    }, carouselDuration);

    return () => clearInterval(interval);
  }, [carouselWidth, currentIndex, isInteracting, items.length, progress]);

  const activeDotStyle = useAnimatedStyle(() => ({
    width: 8 + progress.value * 22,
  }));

  if (!items.length) return null;

  function handlePageChange(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const pageWidth = event.nativeEvent.layoutMeasurement.width;
    if (!pageWidth) return;
    setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
    setIsInteracting(false);
  }

  return (
    <View style={styles.bannerWrap}>
      <ScrollView
        horizontal
        onMomentumScrollEnd={handlePageChange}
        onScrollBeginDrag={() => {
          setIsInteracting(true);
          progress.set(0);
        }}
        pagingEnabled
        ref={scrollViewRef}
        showsHorizontalScrollIndicator={false}
      >
        {items.map((city) => (
          <Pressable
            key={city.id}
            onPress={() => router.push(`/(app)/cities/${city.id}`)}
            style={[styles.carouselPage, { width: carouselWidth }]}
          >
            <RemoteImage
              icon={fallbackImages.city}
              source={cityCoverUrls.get(city.id)}
              style={styles.banner}
            />
            <View style={styles.bannerOverlay}>
              <Text style={styles.bannerEyebrow}>Descubra a serra</Text>
              <Text numberOfLines={1} style={styles.bannerTitle}>
                {city.name}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
      {items.length > 1 && (
        <View style={styles.bannerDots}>
          {items.map((city, index) =>
            index === currentIndex ? (
              <View key={city.id} style={styles.bannerDotTrack}>
                <Animated.View style={[styles.bannerDotActive, activeDotStyle]} />
              </View>
            ) : (
              <View key={city.id} style={styles.bannerDot} />
            ),
          )}
        </View>
      )}
    </View>
  );
}

function HomeSectionState({
  children,
  emptyText,
  query,
}: {
  children: React.ReactNode;
  emptyText: string;
  query: { isError: boolean; isLoading: boolean; refetch: () => void };
}) {
  if (query.isLoading)
    return <ActivityIndicator color={colors.primary} style={styles.sectionState} />;
  if (query.isError) {
    return (
      <Pressable onPress={query.refetch} style={styles.sectionState}>
        <Text style={styles.sectionStateText}>
          Não foi possível carregar. Tocar para tentar novamente.
        </Text>
      </Pressable>
    );
  }
  if (!children) return <Text style={styles.sectionStateText}>{emptyText}</Text>;
  return <>{children}</>;
}

function Categories() {
  return (
    <View style={styles.sectionBlock}>
      <Text style={styles.sectionTitle}>Categorias</Text>
      <ScrollView
        horizontal
        contentContainerStyle={styles.categoryList}
        showsHorizontalScrollIndicator={false}
      >
        {categories.map((category) => (
          <View key={category} style={styles.category}>
            <Text style={styles.categoryText}>{category}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function Section({
  children,
  onSeeAll,
  title,
}: {
  children: React.ReactNode;
  onSeeAll: () => void;
  title: string;
}) {
  return (
    <View style={styles.sectionBlock}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Pressable onPress={onSeeAll}>
          <Text style={styles.seeAll}>Ver tudo</Text>
        </Pressable>
      </View>
      <View style={styles.cards}>{children}</View>
    </View>
  );
}

function HorizontalCards({ children, gap = 12 }: { children: React.ReactNode; gap?: number }) {
  return (
    <ScrollView
      contentContainerStyle={[styles.horizontalCards, { gap }]}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  );
}

function BusinessCard({
  image,
  onPress,
  tags,
  title,
}: {
  image?: string | null;
  onPress?: () => void;
  tags: string[];
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.horizontalCard}>
      <RemoteImage icon={fallbackImages.business} source={image} style={styles.businessAvatar} />
      <View style={styles.cardBody}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {title}
        </Text>
        <EntityTags tags={tags} />
      </View>
    </Pressable>
  );
}

function CityCard({
  image,
  onPress,
  tags,
  title,
}: {
  image?: string | null;
  onPress?: () => void;
  tags: string[];
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.cityCard}>
      <RemoteImage icon={fallbackImages.city} source={image} style={styles.cityImage} />
      <Text style={styles.cardTitle}>{title}</Text>
      <EntityTags tags={tags} />
    </Pressable>
  );
}

function RemoteImage({
  icon,
  source,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  source?: string | null;
  style: StyleProp<ImageStyle>;
}) {
  const [hasError, setHasError] = useState(false);
  const uri = normalizeImageUrl(source);

  if (!uri || hasError) {
    return <MediaPlaceholder icon={icon} style={style} />;
  }

  return (
    <Image onError={() => setHasError(true)} resizeMode="cover" source={{ uri }} style={style} />
  );
}

function MediaPlaceholder({
  icon,
  style,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  style: StyleProp<ImageStyle>;
}) {
  return (
    <View style={[style as StyleProp<ViewStyle>, styles.mediaPlaceholder]}>
      <Ionicons color={colors.mutedForeground} name={icon} size={32} />
    </View>
  );
}

function EntityTags({ tags }: { tags: string[] }) {
  return <TagBadges tags={tags} />;
}

function formatEventDate(startDate?: string, endDate?: string) {
  if (!startDate) return 'Data a confirmar';

  const format = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(value));

  return endDate ? `${format(startDate)} - ${format(endDate)}` : format(startDate);
}

const styles = {
  screen: { flex: 1, backgroundColor: colors.background },
  content: { gap: 24, paddingBottom: 32, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
    minHeight: 56,
  },
  cityButton: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 4,
    maxWidth: '80%' as const,
    paddingVertical: 8,
  },
  cityName: { color: colors.foreground, fontFamily: 'DMSans-Bold', fontSize: 18 },
  notificationButton: {
    alignItems: 'center' as const,
    height: 40,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    width: 40,
  },
  searchButton: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    backgroundColor: '#27272A',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
  },
  searchText: {
    color: colors.mutedForeground,
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
  },
  bannerWrap: {
    borderRadius: 16,
    height: 226,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  carouselPage: { height: 226 },
  banner: { height: '100%' as const, width: '100%' as const },
  bannerOverlay: {
    backgroundColor: 'rgba(0,0,0,0.38)',
    bottom: 0,
    left: 0,
    padding: 16,
    position: 'absolute' as const,
    right: 0,
  },
  bannerEyebrow: { color: '#E4E4E7', fontFamily: 'DMSans-Medium', fontSize: 13 },
  bannerTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-Bold',
    fontSize: 20,
    paddingRight: 84,
  },
  bannerDots: {
    backgroundColor: colors.background,
    borderRadius: 50,
    bottom: 14,
    flexDirection: 'row' as const,
    gap: 6,
    position: 'absolute' as const,
    padding: 4,
    right: 14,
  },
  bannerDotTrack: {
    backgroundColor: colors.mutedForeground,
    borderRadius: 4,
    height: 8,
    overflow: 'hidden' as const,
    width: 30,
  },
  bannerDotActive: { backgroundColor: colors.foreground, borderRadius: 4, height: 8 },
  bannerDot: {
    backgroundColor: colors.mutedForeground,
    borderRadius: 4,
    height: 8,
    opacity: 0.65,
    width: 8,
  },
  sectionBlock: { gap: 16 },
  sectionHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
    lineHeight: 21,
  },
  seeAll: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  categoryList: { gap: 8 },
  category: {
    borderColor: colors.border,
    backgroundColor: '#27272A',
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  categoryText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  cards: { gap: 16 },
  horizontalCards: { gap: 12 },
  sectionState: { alignSelf: 'flex-start' as const, paddingVertical: 12 },
  sectionStateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  horizontalCard: {
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 8,
    width: 260,
  },
  businessAvatar: {
    backgroundColor: '#27272A',
    borderRadius: 999,
    height: 80,
    overflow: 'hidden' as const,
    width: 80,
  },
  cardBody: { flex: 1, gap: 8, justifyContent: 'center' as const },
  cardTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    lineHeight: 18,
  },
  cardMeta: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  cityCard: {
    gap: 6,
    padding: 8,
    width: 212,
  },
  cityImage: {
    backgroundColor: colors.background,
    borderRadius: 8,
    height: 100,
    width: 196,
  },
  mediaPlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
} as const;
