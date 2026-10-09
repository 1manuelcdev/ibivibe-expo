import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { useEffect, useRef, useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { Toast } from '@/components/Toast';
import { eventApi } from '@/features/events/event-api';
import { useEventDraftStore } from '@/features/events/event-draft-store';
import type { Event } from '@/features/events/models/event-types';
import { colors } from '@/theme/tokens';

type EventCategory = 'all' | 'active' | 'past' | 'inactive' | 'draft';
type PendingDeletion = { event: Event; index: number };

const eventCategories: { key: EventCategory; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'active', label: 'Ativos agora' },
  { key: 'past', label: 'Passados' },
  { key: 'inactive', label: 'Inativos' },
  { key: 'draft', label: 'Rascunhos' },
];

export function MyEventsScreen() {
  const deletionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [optionsEvent, setOptionsEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [pendingDeletion, setPendingDeletion] = useState<PendingDeletion | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<EventCategory>('all');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const query = useQuery({
    queryFn: eventApi.getOwned,
    queryKey: ['my-events'],
  });

  const events = query.data ?? [];
  const draftEvents = events.filter((event) => event.status === 'draft');
  const inactiveEvents = events.filter((event) => event.status !== 'draft' && !event.active);
  const activeEvents = events.filter(
    (event) => event.status !== 'draft' && event.active && !isPast(event),
  );
  const pastEvents = events.filter(
    (event) => event.status !== 'draft' && event.active && isPast(event),
  );
  const visibleEvents = {
    active: selectedCategory === 'all' || selectedCategory === 'active' ? activeEvents : [],
    draft: selectedCategory === 'all' || selectedCategory === 'draft' ? draftEvents : [],
    inactive: selectedCategory === 'all' || selectedCategory === 'inactive' ? inactiveEvents : [],
    past: selectedCategory === 'all' || selectedCategory === 'past' ? pastEvents : [],
  };
  const visibleEventCount = Object.values(visibleEvents).reduce(
    (total, categoryEvents) => total + categoryEvents.length,
    0,
  );
  const remove = useMutation({
    mutationFn: (eventId: string) => eventApi.remove(eventId),
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
      setToastMessage(getApiErrorMessage(error));
      setToastTimer();
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
      setToastMessage('Evento excluído.');
      setToastTimer();
    },
  });

  useEffect(
    () => () => {
      if (deletionTimer.current) clearTimeout(deletionTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    [],
  );

  function setToastTimer() {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMessage(null), 3000);
  }

  function scheduleDeletion(event: Event) {
    const currentEvents = queryClient.getQueryData<Event[]>(['my-events']) ?? [];
    const index = currentEvents.findIndex((item) => item.id === event.id);

    queryClient.setQueryData<Event[]>(['my-events'], (cachedEvents = []) =>
      cachedEvents.filter((item) => item.id !== event.id),
    );
    setPendingDeletion({ event, index: index < 0 ? currentEvents.length : index });
    setToastMessage('Evento será excluído.');

    if (deletionTimer.current) clearTimeout(deletionTimer.current);
    deletionTimer.current = setTimeout(() => {
      setPendingDeletion(null);
      setToastMessage('Excluindo evento...');
      remove.mutate(event.id);
    }, 5000);
  }

  function undoDeletion() {
    if (!pendingDeletion) return;

    if (deletionTimer.current) clearTimeout(deletionTimer.current);
    queryClient.setQueryData<Event[]>(['my-events'], (cachedEvents = []) => {
      if (cachedEvents.some((event) => event.id === pendingDeletion.event.id)) return cachedEvents;

      const restoredEvents = [...cachedEvents];
      restoredEvents.splice(pendingDeletion.index, 0, pendingDeletion.event);
      return restoredEvents;
    });
    setPendingDeletion(null);
    setToastMessage('Exclusão desfeita.');
    setToastTimer();
  }

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable
            accessibilityLabel="Voltar"
            hitSlop={8}
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(app)/accounts');
            }}
          >
            <Ionicons color={colors.foreground} name="arrow-back" size={25} />
          </Pressable>
          <Text style={styles.title}>Meus Eventos</Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.filterContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryScroll}
        >
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
          {eventCategories.map((category) => {
            const selected = selectedCategory === category.key;

            return (
              <Pressable
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                style={[styles.filterButton, selected && styles.filterButtonActive]}
              >
                <Text style={[styles.filterLabel, selected && styles.filterLabelActive]}>
                  {category.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

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

        {!query.isLoading && !query.isError && events.length && !visibleEventCount ? (
          <EventsState text="Nenhum evento nessa categoria." />
        ) : null}

        {!query.isLoading && !query.isError && events.length && visibleEventCount ? (
          <>
            <EventSection
              events={visibleEvents.active}
              onEventPress={(event) => router.push(`/(app)/events/${event.id}`)}
              onOptionsPress={setOptionsEvent}
              title="Ativos agora"
            />
            <EventSection
              events={visibleEvents.past}
              onEventPress={(event) => router.push(`/(app)/events/${event.id}`)}
              onOptionsPress={setOptionsEvent}
              title="Passados"
            />
            <EventSection
              events={visibleEvents.inactive}
              onEventPress={(event) => router.push(`/(app)/events/${event.id}`)}
              onOptionsPress={setOptionsEvent}
              title="Inativos"
            />
            <EventSection
              events={visibleEvents.draft}
              onEventPress={(event) => router.push(`/(app)/events/edit/${event.id}`)}
              onOptionsPress={setOptionsEvent}
              title="Rascunhos"
            />
          </>
        ) : null}
      </ScrollView>
      <EventOptionsModal
        event={optionsEvent}
        onClose={() => setOptionsEvent(null)}
        onEdit={() => {
          if (!optionsEvent) return;
          const eventId = optionsEvent.id;
          setOptionsEvent(null);
          router.push(`/(app)/events/edit/${eventId}`);
        }}
        onDelete={() => {
          setDeleteError(null);
          setDeleteEvent(optionsEvent);
          setOptionsEvent(null);
        }}
      />
      <DeleteEventModal
        error={deleteError}
        event={deleteEvent}
        isDeleting={remove.isPending}
        onCancel={() => {
          if (!remove.isPending) {
            setDeleteEvent(null);
            setDeleteError(null);
          }
        }}
        onConfirm={() => {
          if (deleteEvent) {
            const event = deleteEvent;
            setDeleteEvent(null);
            setDeleteError(null);
            scheduleDeletion(event);
          }
        }}
      />
      <Toast
        actionLabel={pendingDeletion ? 'Desfazer' : undefined}
        message={toastMessage ?? ''}
        onAction={undoDeletion}
        visible={Boolean(toastMessage)}
      />
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
              <Ionicons color={colors.foreground} name="ellipsis-horizontal" size={19} />
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

function EventOptionsModal({
  event,
  onDelete,
  onClose,
  onEdit,
}: {
  event: Event | null;
  onClose: () => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  return (
    <ActionModal
      description="Gerencie este evento"
      onClose={onClose}
      title={event?.name ?? ''}
      visible={Boolean(event)}
    >
      <ActionModalItem
        description="Altere dados, tags e mídias"
        icon="create-outline"
        onPress={onEdit}
        title="Editar evento"
      />
      <ActionModalItem
        description="Essa ação não pode ser desfeita"
        destructive
        icon="trash-outline"
        onPress={onDelete}
        title="Excluir evento"
      />
    </ActionModal>
  );
}

function DeleteEventModal({
  error,
  event,
  isDeleting,
  onCancel,
  onConfirm,
}: {
  error: string | null;
  event: Event | null;
  isDeleting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <ActionModal
      description={`O evento ${event?.name ?? ''} será removido permanentemente.`}
      onClose={onCancel}
      title="Excluir evento?"
      visible={Boolean(event)}
    >
      {error ? <Text style={styles.deleteError}>{error}</Text> : null}
      <View style={styles.confirmActions}>
        <Pressable disabled={isDeleting} onPress={onCancel} style={styles.confirmCancelButton}>
          <Text style={styles.confirmCancelLabel}>Cancelar</Text>
        </Pressable>
        <Pressable
          disabled={isDeleting}
          onPress={onConfirm}
          style={[styles.confirmDeleteButton, isDeleting && styles.disabledButton]}
        >
          <Text style={styles.confirmDeleteLabel}>{isDeleting ? 'Excluindo...' : 'Excluir'}</Text>
        </Pressable>
      </View>
    </ActionModal>
  );
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
  categoryScroll: { width: '100%' as const },
  filterContent: { alignItems: 'center' as const, gap: 8 },
  filterButton: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center' as const,
    paddingHorizontal: 14,
  },
  filterButtonActive: {
    backgroundColor: colors.foreground,
    borderColor: colors.foreground,
  },
  filterLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 13 },
  filterLabelActive: { color: colors.primaryForeground },
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
    backgroundColor: 'transparent',
    height: 40,
    justifyContent: 'center' as const,
    width: 32,
  },
  deleteError: {
    color: '#FCA5A5',
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center' as const,
  },
  confirmActions: { flexDirection: 'row' as const, gap: 8, marginTop: 20 },
  confirmCancelButton: {
    alignItems: 'center' as const,
    borderColor: colors.border,
    borderRadius: 22,
    borderWidth: 1,
    flex: 1,
    height: 44,
    justifyContent: 'center' as const,
  },
  confirmCancelLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  confirmDeleteButton: {
    alignItems: 'center' as const,
    backgroundColor: '#DC2626',
    borderRadius: 22,
    flex: 1,
    height: 44,
    justifyContent: 'center' as const,
  },
  confirmDeleteLabel: { color: '#FFFFFF', fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  disabledButton: { opacity: 0.5 },
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
