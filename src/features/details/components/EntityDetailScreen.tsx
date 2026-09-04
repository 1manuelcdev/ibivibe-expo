import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';

import type { BusinessDetail, CityDetail, EventDetail } from '@/features/details/detail-api';
import { useDetailViewModel } from '@/features/details/viewmodels/useDetailViewModel';
import { useFavoritesViewModel } from '@/features/favorites/viewmodels/useFavoritesViewModel';
import { colors } from '@/theme/tokens';

type Kind = 'city' | 'event' | 'business';

export function EntityDetailScreen({ id, kind }: { id: string; kind: Kind }) {
  const router = useRouter();
  const query = useDetailViewModel(kind, id);
  const { accountId, add, favorites, remove } = useFavoritesViewModel();
  const data = query.data as CityDetail | EventDetail | BusinessDetail | undefined;

  if (query.isLoading)
    return (
      <DetailShell onBack={() => router.back()}>
        <Loading />
      </DetailShell>
    );
  if (query.isError || !data)
    return (
      <DetailShell onBack={() => router.back()}>
        <Empty
          icon="alert-circle-outline"
          text={`Erro ao carregar ${kind === 'city' ? 'cidade' : kind === 'event' ? 'evento' : 'empresa'}.`}
          onRetry={() => query.refetch()}
        />
      </DetailShell>
    );

  const title =
    kind === 'business'
      ? ((data as BusinessDetail).commercial_name ?? (data as BusinessDetail).name ?? 'Empresa')
      : (data as CityDetail | EventDetail).name;
  const image =
    kind === 'business'
      ? ((data as BusinessDetail).media?.[0]?.url ?? (data as BusinessDetail).avatar_url)
      : kind === 'city'
        ? ((data as CityDetail).media?.[0]?.url ?? (data as CityDetail).cover_img_url)
        : (data as EventDetail).cover_img_url;
  const tags = (data as CityDetail | EventDetail | BusinessDetail).tags ?? [];
  const favorite = favorites.data?.find((item) =>
    kind === 'city'
      ? item.city_id === id
      : kind === 'event'
        ? item.event_id === id
        : item.business_id === id,
  );
  const isFavorite = Boolean(favorite);

  async function toggleFavorite() {
    if (!accountId || add.isPending || remove.isPending) return;
    if (favorite) {
      await remove.mutateAsync(favorite.id);
      return;
    }
    await add.mutateAsync({
      account_id: accountId,
      ...(kind === 'city'
        ? { city_id: id }
        : kind === 'event'
          ? { event_id: id }
          : { business_id: id }),
    });
  }

  return (
    <DetailShell onBack={() => router.back()}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Media
          image={image}
          icon={
            kind === 'city'
              ? 'location-outline'
              : kind === 'event'
                ? 'calendar-outline'
                : 'briefcase-outline'
          }
        />
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable
            disabled={!accountId || add.isPending || remove.isPending}
            onPress={toggleFavorite}
          >
            <Ionicons
              color={isFavorite ? colors.primary : colors.foreground}
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={26}
            />
          </Pressable>
        </View>
        <View style={styles.tags}>
          {(tags.length
            ? tags
            : [kind === 'city' ? 'Cidade' : kind === 'event' ? 'Evento' : 'Negócio']
          ).map((tag) => (
            <Text key={tag} style={styles.tag}>
              {tag}
            </Text>
          ))}
        </View>
        {kind === 'event' ? (
          <EventBody data={data as EventDetail} />
        ) : kind === 'city' ? (
          <CityBody data={data as CityDetail} />
        ) : (
          <BusinessBody data={data as BusinessDetail} />
        )}
      </ScrollView>
    </DetailShell>
  );
}

function DetailShell({ children, onBack }: { children: React.ReactNode; onBack: () => void }) {
  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={onBack}>
          <Ionicons color={colors.foreground} name="arrow-back" size={24} />
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>
      {children}
    </View>
  );
}
function Media({ image, icon }: { image?: string | null; icon: keyof typeof Ionicons.glyphMap }) {
  const [failed, setFailed] = useState(false);
  return image && !failed ? (
    <Image
      onError={() => setFailed(true)}
      resizeMode="cover"
      source={{ uri: image }}
      style={styles.media}
    />
  ) : (
    <View style={[styles.media, styles.mediaFallback]}>
      <Ionicons color={colors.mutedForeground} name={icon} size={56} />
    </View>
  );
}
function Description({ text }: { text?: string | null }) {
  return <Text style={styles.description}>{text?.trim() || 'Sem descrição disponível.'}</Text>;
}
function EventBody({ data }: { data: EventDetail }) {
  return (
    <View style={styles.body}>
      <Info icon="calendar-outline" text={formatDate(data.start_date, data.end_date)} />
      <Description text={data.description} />
      <SectionTitle text="Mais informações" />
    </View>
  );
}
function CityBody({ data }: { data: CityDetail }) {
  return (
    <View style={styles.body}>
      <Description text={data.description} />
      <SectionTitle text="Acontecendo agora" />
    </View>
  );
}
function BusinessBody({ data }: { data: BusinessDetail }) {
  return (
    <View style={styles.body}>
      <Description text={data.bio ?? data.description} />
      {data.reviews && (
        <Info
          icon="star-outline"
          text={`${(data.reviews.average_rating ?? 0).toFixed(1)} (${data.reviews.total_reviews ?? 0} avaliações)`}
        />
      )}
      {data.contact?.phone && <Info icon="call-outline" text={data.contact.phone} />}
      {data.locations?.map((location, index) => (
        <Info
          key={`${location.city?.name}-${index}`}
          icon="location-outline"
          text={`${location.city?.name ?? 'Localização'}${location.is_headquarter ? ' (matriz)' : ''}`}
        />
      ))}
      {data.services && data.services.length > 0 && (
        <>
          <SectionTitle text="Serviços" />
          {data.services.map((service) => (
            <Info key={service.name} icon="storefront-outline" text={service.name} />
          ))}
        </>
      )}
    </View>
  );
}
function Info({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text?: string | null }) {
  if (!text) return null;
  return (
    <View style={styles.info}>
      <Ionicons color={colors.mutedForeground} name={icon} size={20} />
      <Text style={styles.infoText}>{text}</Text>
    </View>
  );
}
function SectionTitle({ text }: { text: string }) {
  return <Text style={styles.sectionTitle}>{text}</Text>;
}
function Loading() {
  return (
    <View style={styles.loading}>
      <ActivityIndicator color={colors.primary} size="large" />
    </View>
  );
}
function Empty({
  icon,
  onRetry,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onRetry: () => void;
  text: string;
}) {
  return (
    <View style={styles.loading}>
      <Ionicons color={colors.mutedForeground} name={icon} size={56} />
      <Text style={styles.description}>{text}</Text>
      <Pressable onPress={onRetry} style={styles.retry}>
        <Text style={styles.retryText}>Tentar novamente</Text>
      </Pressable>
    </View>
  );
}
function formatDate(start?: string, end?: string) {
  if (!start) return 'Data não informada';
  const format = (value: string) =>
    new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
      new Date(value),
    );
  return end ? `${format(start)} – ${format(end)}` : format(start);
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    height: 56,
    paddingHorizontal: 16,
  },
  headerSpacer: { flex: 1 },
  content: { gap: 16, paddingBottom: 32, paddingHorizontal: 16 },
  media: { backgroundColor: '#27272A', borderRadius: 16, height: 300, width: '100%' as const },
  mediaFallback: { alignItems: 'center' as const, justifyContent: 'center' as const },
  titleRow: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    gap: 12,
    justifyContent: 'space-between' as const,
  },
  title: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 28,
    lineHeight: 34,
  },
  tags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  tag: {
    backgroundColor: '#3F3F46',
    borderRadius: 7,
    color: '#E4E4E7',
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  body: { borderTopColor: colors.border, borderTopWidth: 1, gap: 16, paddingTop: 16 },
  description: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 15,
    lineHeight: 23,
  },
  info: { alignItems: 'flex-start' as const, flexDirection: 'row' as const, gap: 10 },
  infoText: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    lineHeight: 21,
  },
  sectionTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    marginTop: 4,
  },
  loading: {
    alignItems: 'center' as const,
    flex: 1,
    gap: 16,
    justifyContent: 'center' as const,
    padding: 32,
  },
  retry: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  retryText: { color: colors.primaryForeground, fontFamily: 'DMSans-Medium', fontSize: 16 },
} as const;
