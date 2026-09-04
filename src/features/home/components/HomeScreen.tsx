import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Image,
  type ImageStyle,
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  type ViewStyle,
  View,
} from 'react-native';

import { useSessionStore } from '@/stores/session-store';
import { LocationSheet } from '@/features/home/components/LocationSheet';
import { useHomeViewModel } from '@/features/home/viewmodels/useHomeViewModel';
import { colors, radius } from '@/theme/tokens';

const categories = [
  'Restaurantes',
  'Hotéis e Pousadas',
  'Postos de Gasolina',
  'Banhos',
  'Comércio',
  'Aventura',
];
const events = [
  {
    id: undefined,
    title: 'Acontecendo agora',
    date: 'Hoje',
    tag: 'Evento',
    image: 'https://cdn.ibivibe.com.br/cities/ubajara.png',
  },
  {
    title: 'Programação da Ibiapaba',
    date: 'Esta semana',
    tag: 'Cultura',
    image: 'https://cdn.ibivibe.com.br/cities/tiangua.png',
  },
  {
    title: 'Experiências para descobrir',
    date: 'Este mês',
    tag: 'Lazer',
    image: 'https://cdn.ibivibe.com.br/cities/ubajara.png',
  },
];
const businesses = [
  {
    id: undefined,
    title: 'Conheça negócios locais',
    tags: ['Comércio', 'Serviços'],
    image: 'https://cdn.ibivibe.com.br/cities/tiangua.png',
  },
  {
    title: 'Sabores da Ibiapaba',
    tags: ['Restaurante', 'Gastronomia'],
    image: 'https://cdn.ibivibe.com.br/cities/ubajara.png',
  },
  {
    title: 'Hospedagens para sua viagem',
    tags: ['Hotel', 'Turismo'],
    image: 'https://cdn.ibivibe.com.br/cities/tiangua.png',
  },
];
const cities = [
  {
    id: undefined,
    title: 'Ubajara',
    tags: ['Natureza', 'Turismo'],
    image: 'https://cdn.ibivibe.com.br/cities/ubajara.png',
  },
  {
    title: 'Tianguá',
    tags: ['Serra', 'Comércio'],
    image: 'https://cdn.ibivibe.com.br/cities/tiangua.png',
  },
];

const fallbackImages = {
  business: 'briefcase-outline' as const,
  city: 'location-outline' as const,
  event: 'calendar-outline' as const,
};

const legacyCdnPathPattern = /^\/(cities|businesses|events|users)\//;

function normalizeImageUrl(value?: string | null) {
  const url = value?.trim();

  if (!url) return null;
  const normalizedProtocolUrl = url.startsWith('//') ? `https:${url}` : url;

  if (
    !normalizedProtocolUrl.startsWith('http://') &&
    !normalizedProtocolUrl.startsWith('https://')
  ) {
    return null;
  }

  try {
    const parsedUrl = new URL(normalizedProtocolUrl);

    // Compatibilidade com URLs antigas do Flutter/seed. Os arquivos atuais
    // ficam em /media, enquanto versões antigas apontavam direto para /cities.
    if (
      parsedUrl.hostname === 'cdn.ibivibe.com.br' &&
      legacyCdnPathPattern.test(parsedUrl.pathname)
    ) {
      parsedUrl.pathname = `/media${parsedUrl.pathname}`;
    }

    return parsedUrl.toString();
  } catch {
    return null;
  }
}

export function HomeScreen() {
  const router = useRouter();
  const [locationSheetVisible, setLocationSheetVisible] = useState(false);
  const [selectedCity, setSelectedCity] = useState('Selecione uma cidade');
  const {
    businesses: businessesQuery,
    cities: citiesQuery,
    events: eventsQuery,
  } = useHomeViewModel();
  const eventItems = eventsQuery.data
    ? eventsQuery.data.slice(0, 3).map((event) => ({
        id: event.id,
        title: event.name,
        date: formatEventDate(event.start_date, event.end_date),
        tag: event.tags?.[0] ?? 'Evento',
        image: event.cover_img_url,
      }))
    : events;
  const businessItems = businessesQuery.data
    ? businessesQuery.data.slice(0, 5).map((business) => ({
        id: business.id,
        title: business.name ?? business.commercial_name ?? 'Empresa',
        tags: business.tags?.slice(0, 2) ?? ['Negócio local'],
        image: business.avatar_url,
      }))
    : businesses;
  const cityItems = citiesQuery.data
    ? citiesQuery.data.slice(0, 5).map((city) => ({
        id: city.id,
        title: city.name,
        tags: city.tags?.slice(0, 2) ?? ['Ibiapaba'],
        image: city.cover_img_url,
      }))
    : cities;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <HomeHeader city={selectedCity} onLocationPress={() => setLocationSheetVisible(true)} />
        <Pressable
          onPress={() => router.push('/(app)/search/expanded')}
          style={styles.searchButton}
        >
          <Ionicons color={colors.mutedForeground} name="search-outline" size={20} />
          <Text style={styles.searchText}>O que vamos fazer hoje na Ibiapaba?</Text>
        </Pressable>
        <SponsoredHighlights />
        <Categories />
        <Section title="Acontecendo agora" onSeeAll={() => router.push('/(app)/events')}>
          {eventItems.map((event) => (
            <EventCard
              key={event.title}
              {...event}
              onPress={event.id ? () => router.push(`/(app)/events/${event.id}`) : undefined}
            />
          ))}
        </Section>
        <Section
          title="Explore as empresas da Ibiapaba"
          onSeeAll={() => router.push('/(app)/businesses')}
        >
          {businessItems.map((business) => (
            <BusinessCard
              key={business.title}
              {...business}
              onPress={
                business.id ? () => router.push(`/(app)/businesses/${business.id}`) : undefined
              }
            />
          ))}
        </Section>
        <Section
          title="Explore as cidades da Ibiapaba"
          onSeeAll={() => router.push('/(app)/cities')}
        >
          {cityItems.map((city) => (
            <CityCard
              key={city.title}
              {...city}
              onPress={city.id ? () => router.push(`/(app)/cities/${city.id}`) : undefined}
            />
          ))}
        </Section>
      </ScrollView>
      <LocationSheet
        onClose={() => setLocationSheetVisible(false)}
        onSelect={(city) => {
          setSelectedCity(city);
          setLocationSheetVisible(false);
        }}
        selectedCity={selectedCity}
        visible={locationSheetVisible}
      />
    </View>
  );
}

function HomeHeader({ city, onLocationPress }: { city: string; onLocationPress: () => void }) {
  const router = useRouter();
  const logout = useSessionStore((state) => state.logout);

  return (
    <View style={styles.header}>
      <Pressable onPress={onLocationPress} style={styles.cityButton}>
        <Text numberOfLines={1} style={styles.cityName}>
          {city}
        </Text>
        <Ionicons color={colors.foreground} name="chevron-down" size={18} />
      </Pressable>
      <Pressable
        accessibilityLabel="Notificações"
        onPress={async () => {
          // TEMPORÁRIO: o sino ainda não possui tela de notificações; usa logout para teste.
          await logout();
          router.replace('/');
        }}
        style={styles.notificationButton}
      >
        <Ionicons color={colors.foreground} name="notifications-outline" size={24} />
        <View style={styles.notificationDot} />
      </Pressable>
    </View>
  );
}

function SponsoredHighlights() {
  return (
    <View style={styles.bannerWrap}>
      <RemoteImage
        icon={fallbackImages.city}
        source="https://cdn.ibivibe.com.br/cities/ubajara.png"
        style={styles.banner}
      />
      <View style={styles.bannerOverlay}>
        <Text style={styles.bannerEyebrow}>Descubra a serra</Text>
        <Text style={styles.bannerTitle}>Ubajara</Text>
      </View>
      <View style={styles.bannerDots}>
        <View style={styles.bannerDotActive} />
        <View style={styles.bannerDot} />
      </View>
    </View>
  );
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

function EventCard({
  date,
  image,
  onPress,
  tag,
  title,
}: {
  date: string;
  image?: string | null;
  onPress?: () => void;
  tag: string;
  title: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <RemoteImage icon={fallbackImages.event} source={image} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {title}
        </Text>
        <Text style={styles.cardMeta}>{date}</Text>
        <Badge label={tag} />
      </View>
    </Pressable>
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
    <Pressable onPress={onPress} style={styles.card}>
      <RemoteImage icon={fallbackImages.business} source={image} style={styles.thumb} />
      <View style={styles.cardBody}>
        <Text numberOfLines={2} style={styles.cardTitle}>
          {title}
        </Text>
        <View style={styles.badgeRow}>
          {tags.map((tag) => (
            <Badge key={tag} label={tag} />
          ))}
        </View>
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
      <View style={styles.badgeRow}>
        {tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
      </View>
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

function Badge({ label }: { label: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>{label}</Text>
    </View>
  );
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
  cityName: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  notificationButton: {
    alignItems: 'center' as const,
    height: 40,
    justifyContent: 'center' as const,
    position: 'relative' as const,
    width: 40,
  },
  notificationDot: {
    backgroundColor: colors.primary,
    borderColor: colors.background,
    borderRadius: 6,
    borderWidth: 2,
    height: 12,
    position: 'absolute' as const,
    right: 2,
    top: 3,
    width: 12,
  },
  searchButton: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    height: 48,
    paddingHorizontal: 16,
  },
  searchText: {
    color: colors.mutedForeground,
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
  },
  bannerWrap: {
    borderRadius: 12,
    height: 230,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
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
  bannerTitle: { color: colors.foreground, fontFamily: 'DMSans-Bold', fontSize: 24 },
  bannerDots: {
    bottom: 12,
    flexDirection: 'row' as const,
    gap: 6,
    position: 'absolute' as const,
    right: 14,
  },
  bannerDotActive: { backgroundColor: colors.primary, borderRadius: 4, height: 8, width: 8 },
  bannerDot: {
    backgroundColor: colors.foreground,
    borderRadius: 4,
    height: 8,
    opacity: 0.65,
    width: 8,
  },
  sectionBlock: { gap: 8 },
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
  seeAll: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  categoryList: { gap: 6 },
  category: {
    borderColor: colors.border,
    borderRadius: radius.button,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  categoryText: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 16 },
  cards: { gap: 16 },
  card: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    padding: 12,
  },
  thumb: { backgroundColor: colors.background, borderRadius: 8, height: 70, width: 70 },
  cardBody: { flex: 1, gap: 6, justifyContent: 'center' as const },
  cardTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    lineHeight: 19,
  },
  cardMeta: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  badgeRow: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4 },
  badge: {
    alignSelf: 'flex-start' as const,
    backgroundColor: '#3F3F46',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeText: { color: '#E4E4E7', fontFamily: 'DMSans-Regular', fontSize: 11 },
  cityCard: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    padding: 12,
  },
  cityImage: {
    backgroundColor: colors.background,
    borderRadius: 8,
    height: 140,
    width: '100%' as const,
  },
  mediaPlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
} as const;
