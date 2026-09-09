import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useState } from 'react';

import type { BusinessDetail, CityDetail, EventDetail } from '@/features/details/detail-api';
import { useDetailViewModel } from '@/features/details/viewmodels/useDetailViewModel';
import { FavoriteButton } from '@/components/FavoriteButton';
import { BottomSheet } from '@/components/BottomSheet';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import { useFavoritesViewModel } from '@/features/favorites/viewmodels/useFavoritesViewModel';
import { ReviewSection } from '@/features/reviews/components/ReviewSection';
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

  if (kind === 'business') {
    return (
      <BusinessDetailPage
        data={data as BusinessDetail}
        disabled={!accountId || add.isPending || remove.isPending}
        isFavorite={isFavorite}
        onBack={() => router.back()}
        onToggleFavorite={toggleFavorite}
      />
    );
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
          <FavoriteButton
            disabled={!accountId || add.isPending || remove.isPending}
            isFavorite={isFavorite}
            onPress={toggleFavorite}
            size={26}
          />
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
        ) : (
          <CityBody data={data as CityDetail} />
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
      <ReviewSection entityId={data.id} kind="event" />
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
function BusinessDetailPage({
  data,
  disabled,
  isFavorite,
  onBack,
  onToggleFavorite,
}: {
  data: BusinessDetail;
  disabled: boolean;
  isFavorite: boolean;
  onBack: () => void;
  onToggleFavorite: () => Promise<void>;
}) {
  const [activeSheet, setActiveSheet] = useState<'contact' | 'hours' | 'location' | null>(null);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const title = data.commercial_name ?? data.name ?? 'Empresa';
  const slug = title.toLocaleLowerCase('pt-BR').replaceAll(/\s+/g, '-');
  // A descrição é um atributo da empresa. `bio` é da conta proprietária e só
  // serve como compatibilidade para empresas criadas antes desse alinhamento.
  const description = data.description?.trim() || data.bio?.trim() || 'Sem descrição disponível.';
  const contactRows = [
    data.contact?.phone && { icon: 'call-outline' as const, text: data.contact.phone },
    data.contact?.whatsapp && { icon: 'logo-whatsapp' as const, text: data.contact.whatsapp },
    data.contact?.public_email && {
      icon: 'mail-outline' as const,
      text: data.contact.public_email,
    },
    data.contact?.website && { icon: 'globe-outline' as const, text: data.contact.website },
    data.contact?.instagram && { icon: 'logo-instagram' as const, text: data.contact.instagram },
    data.contact?.facebook && { icon: 'logo-facebook' as const, text: data.contact.facebook },
  ].filter(Boolean) as Array<{ icon: keyof typeof Ionicons.glyphMap; text: string }>;
  const galleryImages =
    data.media?.filter((item) => item.media_type !== 'video').map((item) => item.url) ?? [];
  if (!galleryImages.length && data.avatar_url) galleryImages.push(data.avatar_url);

  return (
    <View style={styles.screen}>
      <View style={styles.businessHeader}>
        <Pressable accessibilityLabel="Voltar" hitSlop={12} onPress={onBack}>
          <Ionicons color={colors.foreground} name="arrow-back" size={25} />
        </Pressable>
        <Text numberOfLines={1} style={styles.businessSlug}>
          {slug}
        </Text>
        <FavoriteButton
          disabled={disabled}
          isFavorite={isFavorite}
          onPress={onToggleFavorite}
          size={26}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.businessContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.businessProfile}>
          {data.avatar_url ? (
            <Image source={{ uri: data.avatar_url }} style={styles.businessAvatar} />
          ) : (
            <View style={styles.businessAvatar} />
          )}
          <View style={styles.businessProfileText}>
            <View style={styles.businessNameRow}>
              <Text numberOfLines={1} style={styles.businessName}>
                {title}
              </Text>
              {data.is_verified ? (
                <Ionicons color="#4ADE80" name="diamond-outline" size={16} />
              ) : null}
            </View>
            <View style={styles.businessTags}>
              {(data.tags?.length ? data.tags : ['Negócio']).slice(0, 3).map((tag) => (
                <Text key={tag} style={styles.businessTag}>
                  {tag}
                </Text>
              ))}
            </View>
          </View>
        </View>

        <Text style={styles.businessDescription}>{description}</Text>
        <BusinessMediaCarousel images={galleryImages} onOpenImage={setViewerIndex} />

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.actionScroller}>
          <View style={styles.businessActions}>
            <BusinessAction
              icon="albums-outline"
              label="Contatos e Redes sociais"
              onPress={() => setActiveSheet('contact')}
            />
            <BusinessAction
              icon="time-outline"
              label="Horário de funcionamento"
              onPress={() => setActiveSheet('hours')}
            />
            <BusinessAction
              icon="location-outline"
              label="Localização"
              onPress={() => setActiveSheet('location')}
            />
          </View>
        </ScrollView>

        <ReviewSection entityId={data.id} kind="business" />

        {contactRows.length > 0 ||
        data.locations?.length ||
        data.hours?.length ||
        data.services?.length ? (
          <View style={styles.businessInfoSection}>
            {contactRows.map((item) => (
              <Info icon={item.icon} key={item.text} text={item.text} />
            ))}
            {data.hours?.some((hour) => !hour.is_closed) && (
              <Info icon="time-outline" text="Horários disponíveis" />
            )}
            {data.locations?.map((location, index) => (
              <Info
                key={`${location.city?.name}-${index}`}
                icon="location-outline"
                text={`${location.city?.name ?? 'Localização'}${location.is_headquarter ? ' (matriz)' : ''}`}
              />
            ))}
            {data.services?.map((service) => (
              <Info icon="storefront-outline" key={service.name} text={service.name} />
            ))}
          </View>
        ) : null}
      </ScrollView>
      <BusinessInfoSheet
        onClose={() => setActiveSheet(null)}
        title="Contatos e redes sociais"
        visible={activeSheet === 'contact'}
      >
        {contactRows.length ? (
          contactRows.map((item) => <Info icon={item.icon} key={item.text} text={item.text} />)
        ) : (
          <SheetEmpty text="Esta empresa ainda não informou contatos públicos." />
        )}
      </BusinessInfoSheet>
      <BusinessInfoSheet
        onClose={() => setActiveSheet(null)}
        title="Horário de funcionamento"
        visible={activeSheet === 'hours'}
      >
        {data.hours?.length ? (
          data.hours.map((hour) => (
            <View key={hour.weekday} style={styles.hoursRow}>
              <Text style={styles.hoursDay}>{weekdayName(hour.weekday)}</Text>
              <Text style={styles.hoursValue}>
                {hour.is_closed ? 'Fechado' : `${hour.opens_at ?? '—'} às ${hour.closes_at ?? '—'}`}
              </Text>
            </View>
          ))
        ) : (
          <SheetEmpty text="Esta empresa ainda não informou seus horários." />
        )}
      </BusinessInfoSheet>
      <BusinessInfoSheet
        onClose={() => setActiveSheet(null)}
        title="Localização"
        visible={activeSheet === 'location'}
      >
        {data.locations?.length ? (
          data.locations.map((location, index) => (
            <View key={`${location.city?.name}-${index}`} style={styles.locationRow}>
              <Ionicons color={colors.mutedForeground} name="location-outline" size={21} />
              <View style={styles.locationText}>
                <Text style={styles.locationName}>
                  {location.city?.name ?? 'Localização'}
                  {location.is_headquarter ? ' (matriz)' : ''}
                </Text>
                {location.address ? (
                  <Text style={styles.locationAddress}>{location.address}</Text>
                ) : null}
              </View>
            </View>
          ))
        ) : (
          <SheetEmpty text="Esta empresa ainda não informou uma localização." />
        )}
      </BusinessInfoSheet>
      <FullScreenImageViewer
        images={galleryImages}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        visible={viewerIndex !== null}
      />
    </View>
  );
}

function BusinessAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.businessAction}>
      <Ionicons color={colors.mutedForeground} name={icon} size={24} />
      <Text style={styles.businessActionText}>{label}</Text>
    </Pressable>
  );
}

function BusinessInfoSheet({
  children,
  onClose,
  title,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  visible: boolean;
}) {
  return (
    <BottomSheet onClose={onClose} visible={visible}>
      <View style={styles.sheetHeader}>
        <Text style={styles.sheetTitle}>{title}</Text>
        <Pressable accessibilityLabel="Fechar" onPress={onClose}>
          <Ionicons color={colors.foreground} name="close" size={24} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.sheetContent} showsVerticalScrollIndicator={false}>
        {children}
      </ScrollView>
    </BottomSheet>
  );
}

function SheetEmpty({ text }: { text: string }) {
  return <Text style={styles.sheetEmpty}>{text}</Text>;
}

function BusinessMediaCarousel({
  images,
  onOpenImage,
}: {
  images: string[];
  onOpenImage: (index: number) => void;
}) {
  const { width } = useWindowDimensions();
  const mediaWidth = width - 32;
  const [activeIndex, setActiveIndex] = useState(0);

  if (!images.length) {
    return (
      <View style={[styles.businessMedia, styles.businessMediaFallback]}>
        <Ionicons color={colors.mutedForeground} name="image-outline" size={44} />
      </View>
    );
  }

  return (
    <View style={styles.businessCarousel}>
      <ScrollView
        horizontal
        onMomentumScrollEnd={(event) =>
          setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / mediaWidth))
        }
        pagingEnabled
        showsHorizontalScrollIndicator={false}
      >
        {images.map((uri, index) => (
          <Pressable key={`${uri}-${index}`} onPress={() => onOpenImage(index)}>
            <Image source={{ uri }} style={[styles.businessMedia, { width: mediaWidth }]} />
          </Pressable>
        ))}
      </ScrollView>
      {images.length > 1 ? (
        <View style={styles.carouselDots}>
          {images.map((uri, index) => (
            <View
              key={`${uri}-dot`}
              style={index === activeIndex ? styles.carouselDotActive : styles.carouselDot}
            />
          ))}
        </View>
      ) : null}
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
function weekdayName(weekday: number) {
  return (
    [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ][weekday] ?? 'Dia não informado'
  );
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
  businessHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    height: 56,
    justifyContent: 'space-between' as const,
    paddingHorizontal: 16,
  },
  businessSlug: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-Medium',
    fontSize: 18,
    marginHorizontal: 20,
    textAlign: 'center' as const,
  },
  businessContent: { gap: 16, paddingBottom: 40, paddingHorizontal: 16, paddingTop: 24 },
  businessProfile: { alignItems: 'flex-start' as const, flexDirection: 'row' as const, gap: 10 },
  businessAvatar: { backgroundColor: '#4D4D56', borderRadius: 32, height: 64, width: 64 },
  businessProfileText: { flex: 1, gap: 6, paddingTop: 1 },
  businessNameRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 3 },
  businessName: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    maxWidth: '92%',
  },
  businessTags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4 },
  businessTag: {
    backgroundColor: '#27272A',
    borderRadius: 32,
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    overflow: 'hidden' as const,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  businessDescription: {
    color: colors.foreground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 18,
  },
  businessCarousel: { borderRadius: 12, height: 256, overflow: 'hidden' as const },
  businessMedia: { backgroundColor: '#27272A', borderRadius: 12, height: 256 },
  businessMediaFallback: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    width: '100%' as const,
  },
  carouselDots: {
    alignItems: 'center' as const,
    bottom: 16,
    flexDirection: 'row' as const,
    gap: 6,
    justifyContent: 'center' as const,
    left: 0,
    position: 'absolute' as const,
    right: 0,
  },
  carouselDot: { backgroundColor: '#71717A', borderRadius: 8, height: 8, width: 10 },
  carouselDotActive: { backgroundColor: colors.foreground, borderRadius: 8, height: 8, width: 30 },
  actionScroller: { marginHorizontal: -16 },
  businessActions: { flexDirection: 'row' as const, gap: 12, paddingHorizontal: 16 },
  businessAction: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    gap: 3,
    height: 92,
    justifyContent: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 128,
  },
  businessActionText: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    lineHeight: 19,
  },
  sheetHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sheetTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  sheetContent: { gap: 16, paddingBottom: 16, paddingTop: 20 },
  sheetEmpty: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  hoursRow: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    paddingBottom: 12,
  },
  hoursDay: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  hoursValue: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  locationRow: { alignItems: 'flex-start' as const, flexDirection: 'row' as const, gap: 10 },
  locationText: { flex: 1, gap: 3 },
  locationName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  locationAddress: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  reviewSection: { gap: 10, marginTop: 6 },
  reviewTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  reviewSummary: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  ratingRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10 },
  ratingValue: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 24 },
  stars: { flexDirection: 'row' as const, gap: 2 },
  reviewButton: {
    borderColor: '#4D4D56',
    borderRadius: 24,
    borderWidth: 1.6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  reviewButtonText: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 14 },
  reviewCount: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  businessInfoSection: {
    backgroundColor: '#27272A',
    borderRadius: 12,
    gap: 14,
    marginTop: 6,
    padding: 14,
  },
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
    fontSize: 14,
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
  retryText: { color: colors.primaryForeground, fontFamily: 'DMSans-Medium', fontSize: 14 },
} as const;
