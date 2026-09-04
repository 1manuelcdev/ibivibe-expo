import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import { useHomeViewModel } from '@/features/home/viewmodels/useHomeViewModel';
import type { HomeBusiness, HomeCity, HomeEvent } from '@/features/home/models/home-types';
import { colors } from '@/theme/tokens';

type OverviewKind = 'cities' | 'businesses' | 'events';

export function OverviewScreen({ kind }: { kind: OverviewKind }) {
  const router = useRouter();
  const home = useHomeViewModel();
  const query =
    kind === 'cities' ? home.cities : kind === 'businesses' ? home.businesses : home.events;
  const title = kind === 'cities' ? 'Cidades' : kind === 'businesses' ? 'Empresas' : 'Eventos';
  const subtitle =
    kind === 'cities'
      ? 'Alto da Serra'
      : kind === 'businesses'
        ? 'Novos no app'
        : 'Próximos eventos';

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
        <Text style={styles.headerTitle}>{title}</Text>
        <Pressable onPress={() => router.push('/(app)/search/expanded')}>
          <Ionicons color={colors.foreground} name="search-outline" size={24} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>{subtitle}</Text>
        {query.isLoading ? (
          <LoadingRows />
        ) : query.isError ? (
          <ErrorState onRetry={() => query.refetch()} title={title} />
        ) : query.data?.length ? (
          query.data.map((item) => {
            if (kind === 'cities')
              return (
                <CityRow
                  key={item.id}
                  item={item as HomeCity}
                  onPress={() => router.push(`/(app)/cities/${item.id}`)}
                />
              );
            if (kind === 'businesses')
              return (
                <BusinessRow
                  key={item.id}
                  item={item as HomeBusiness}
                  onPress={() => router.push(`/(app)/businesses/${item.id}`)}
                />
              );
            return (
              <EventRow
                key={item.id}
                item={item as HomeEvent}
                onPress={() => router.push(`/(app)/events/${item.id}`)}
              />
            );
          })
        ) : (
          <EmptyState
            title={`Nenhum ${kind === 'cities' ? 'cidade' : kind === 'businesses' ? 'empresa' : 'evento'} encontrado.`}
          />
        )}
      </ScrollView>
    </View>
  );
}

function CityRow({ item, onPress }: { item: HomeCity; onPress: () => void }) {
  return (
    <EntityRow
      image={item.cover_img_url}
      icon="location-outline"
      onPress={onPress}
      tags={item.tags}
      title={item.name}
    />
  );
}
function BusinessRow({ item, onPress }: { item: HomeBusiness; onPress: () => void }) {
  return (
    <EntityRow
      image={item.avatar_url}
      icon="briefcase-outline"
      onPress={onPress}
      tags={item.tags}
      title={item.name ?? item.commercial_name ?? 'Empresa'}
    />
  );
}
function EventRow({ item, onPress }: { item: HomeEvent; onPress: () => void }) {
  return (
    <EntityRow
      image={item.cover_img_url}
      icon="calendar-outline"
      meta={formatDate(item.start_date, item.end_date)}
      onPress={onPress}
      tags={item.tags}
      title={item.name}
    />
  );
}

function EntityRow({
  image,
  icon,
  meta,
  onPress,
  tags,
  title,
}: {
  image?: string | null;
  icon: keyof typeof Ionicons.glyphMap;
  meta?: string;
  onPress: () => void;
  tags?: string[];
  title: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.thumb}>
        {image && !failed ? (
          <Image
            onError={() => setFailed(true)}
            resizeMode="cover"
            source={{ uri: image }}
            style={styles.thumbImage}
          />
        ) : (
          <Ionicons color={colors.mutedForeground} name={icon} size={30} />
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text numberOfLines={1} style={styles.cardTitle}>
          {title}
        </Text>
        {meta && <Text style={styles.meta}>{meta}</Text>}
        <View style={styles.tags}>
          {(tags?.slice(0, 2) ?? []).map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
      </View>
      <Ionicons color={colors.mutedForeground} name="chevron-forward" size={20} />
    </Pressable>
  );
}
function LoadingRows() {
  return (
    <>
      {[1, 2, 3, 4].map((item) => (
        <View key={item} style={styles.loadingCard}>
          <View style={styles.loadingThumb} />
          <View style={styles.loadingText}>
            <View style={styles.loadingLine} />
            <View style={styles.loadingSmall} />
          </View>
        </View>
      ))}
    </>
  );
}
function ErrorState({ onRetry, title }: { onRetry: () => void; title: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons color={colors.mutedForeground} name="alert-circle-outline" size={52} />
      <Text style={styles.emptyText}>Erro ao carregar {title.toLowerCase()}.</Text>
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}
function EmptyState({ title }: { title: string }) {
  return (
    <View style={styles.empty}>
      <Ionicons color={colors.mutedForeground} name="search-outline" size={52} />
      <Text style={styles.emptyText}>{title}</Text>
    </View>
  );
}
function formatDate(start?: string, end?: string) {
  if (!start) return 'Data não informada';
  const fmt = (v: string) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit' }).format(new Date(v));
  return end ? `${fmt(start)} – ${fmt(end)}` : fmt(start);
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    height: 58,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
  },
  headerTitle: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    marginLeft: 16,
  },
  content: { gap: 12, padding: 16, paddingBottom: 32 },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 17,
    marginBottom: 4,
  },
  card: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 96,
    padding: 12,
  },
  thumb: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    borderRadius: 9,
    height: 70,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    width: 78,
  },
  thumbImage: { height: '100%' as const, width: '100%' as const },
  cardInfo: { flex: 1, gap: 6 },
  cardTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 15 },
  meta: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  tags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4 },
  tag: {
    backgroundColor: '#3F3F46',
    borderRadius: 5,
    color: '#E4E4E7',
    fontFamily: 'DMSans-Regular',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  loadingCard: {
    backgroundColor: '#27272A',
    borderRadius: 14,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 96,
    padding: 12,
  },
  loadingThumb: { backgroundColor: '#3F3F46', borderRadius: 9, height: 70, width: 78 },
  loadingText: { flex: 1, gap: 12, justifyContent: 'center' as const },
  loadingLine: { backgroundColor: '#3F3F46', borderRadius: 4, height: 14, width: '75%' as const },
  loadingSmall: { backgroundColor: '#3F3F46', borderRadius: 4, height: 10, width: '45%' as const },
  empty: { alignItems: 'center' as const, gap: 16, justifyContent: 'center' as const, padding: 40 },
  emptyText: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    textAlign: 'center' as const,
  },
  retry: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
  },
  retryText: { color: colors.primaryForeground, fontFamily: 'DMSans-Medium', fontSize: 16 },
} as const;
