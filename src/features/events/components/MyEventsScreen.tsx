import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { eventApi } from '@/features/events/event-api';
import { useEventDraftStore } from '@/features/events/event-draft-store';
import type { Event } from '@/features/events/models/event-types';
import { colors } from '@/theme/tokens';

export function MyEventsScreen() {
  const router = useRouter();
  const query = useQuery({
    queryFn: eventApi.getOwned,
    queryKey: ['my-events'],
  });

  const events = query.data ?? [];
  const activeEvents = events.filter((event) => !isPast(event));
  const pastEvents = events.filter(isPast);

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={() => router.back()}>
            <Ionicons color={colors.foreground} name="arrow-back" size={25} />
          </Pressable>
          <Text style={styles.title}>Meus Eventos</Text>
        </View>

        <Pressable
          onPress={() => {
            useEventDraftStore.getState().clear();
            router.push('/(app)/events/new');
          }}
          style={styles.createButton}
        >
          <Ionicons color={colors.primaryForeground} name="calendar-outline" size={16} />
          <Text style={styles.createButtonLabel}>Novo Evento</Text>
        </Pressable>

        {query.isLoading ? <EventsState text="Carregando eventos..." /> : null}
        {query.isError ? (
          <EventsState
            text="Não foi possível carregar seus eventos."
            onRetry={() => query.refetch()}
          />
        ) : null}
        {!query.isLoading && !query.isError && !events.length ? (
          <EventsState text="Você ainda não possui eventos cadastrados." />
        ) : null}

        {!query.isLoading && !query.isError && events.length ? (
          <>
            <EventSection
              events={activeEvents}
              onEventPress={(event) => router.push(`/(app)/events/${event.id}`)}
              onOptionsPress={(event) =>
                showEventOptions(event, () => router.push(`/(app)/events/edit/${event.id}`))
              }
              title="Ativos agora"
            />
            <EventSection
              events={pastEvents}
              onEventPress={(event) => router.push(`/(app)/events/${event.id}`)}
              onOptionsPress={(event) =>
                showEventOptions(event, () => router.push(`/(app)/events/edit/${event.id}`))
              }
              title="Passados"
            />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function EventSection({
  events,
  onEventPress,
  onOptionsPress,
  title,
}: {
  events: Event[];
  onEventPress: (event: Event) => void;
  onOptionsPress: (event: Event) => void;
  title: string;
}) {
  if (!events.length) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.eventList}>
        {events.map((event) => (
          <View key={event.id} style={styles.eventRow}>
            <Pressable onPress={() => onEventPress(event)} style={styles.eventCard}>
              {coverUrl(event) ? (
                <Image source={{ uri: coverUrl(event)! }} style={styles.eventImage} />
              ) : (
                <View style={[styles.eventImage, styles.imagePlaceholder]}>
                  <Ionicons color={colors.mutedForeground} name="calendar-outline" size={26} />
                </View>
              )}
              <View style={styles.eventText}>
                <Text numberOfLines={2} style={styles.eventName}>
                  {event.name}
                </Text>
                <Text style={styles.eventDate}>
                  {formatEventDate(event.start_date ?? undefined)}
                </Text>
                <View style={styles.badges}>
                  {(event.tags?.slice(0, 3).map((tag) => tag.name) ?? ['Evento']).map((tag) => (
                    <View key={tag} style={styles.badge}>
                      <Text style={styles.badgeLabel}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Pressable>
            <Pressable
              accessibilityLabel={`Opções de ${event.name}`}
              hitSlop={8}
              onPress={() => onOptionsPress(event)}
              style={styles.optionsButton}
            >
              <Text style={styles.optionsLabel}>...</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

function EventsState({ onRetry, text }: { onRetry?: () => void; text: string }) {
  return (
    <View style={styles.state}>
      <Text style={styles.stateText}>{text}</Text>
      {onRetry ? (
        <Pressable onPress={onRetry} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function showEventOptions(event: Event, onEdit: () => void) {
  Alert.alert(event.name, 'Escolha uma ação para este evento.', [
    { text: 'Editar', onPress: onEdit },
    { text: 'Cancelar', style: 'cancel' },
  ]);
}

function isPast(event: Event) {
  return Boolean(event.end_date && new Date(event.end_date).getTime() < Date.now());
}

function coverUrl(event: Event) {
  return event.medias?.find((media) => media.is_cover)?.url ?? event.medias?.[0]?.url ?? null;
}

function formatEventDate(value?: string) {
  if (!value) return 'Data a confirmar';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data a confirmar';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 32, paddingBottom: 32, paddingHorizontal: 16, paddingTop: 8 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 16,
    paddingHorizontal: 8,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  createButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row' as const,
    gap: 8,
    height: 40,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    alignSelf: 'flex-start' as const,
  },
  createButtonLabel: {
    color: colors.primaryForeground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
  },
  section: { gap: 16 },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  eventList: { gap: 16 },
  eventRow: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    width: '100%' as const,
  },
  eventCard: {
    alignItems: 'center' as const,
    borderRadius: 12,
    flex: 1,
    flexDirection: 'row' as const,
    gap: 12,
    minWidth: 0,
    overflow: 'hidden' as const,
    padding: 8,
  },
  eventImage: { borderRadius: 8, height: 80, width: 80 },
  imagePlaceholder: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    justifyContent: 'center' as const,
  },
  eventText: { gap: 8, minWidth: 0 },
  eventName: { color: '#F4F4F5', fontFamily: 'DMSans-SemiBold', fontSize: 12, maxWidth: 160 },
  eventDate: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  badges: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4, maxWidth: 160 },
  badge: {
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 10 },
  optionsButton: {
    alignItems: 'center' as const,
    height: 40,
    justifyContent: 'center' as const,
    width: 32,
  },
  optionsLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  state: { alignItems: 'center' as const, gap: 12, paddingVertical: 32 },
  stateText: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  retryButton: {
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
} as const;
