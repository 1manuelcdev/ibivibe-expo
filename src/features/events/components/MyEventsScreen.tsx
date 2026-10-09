import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useState } from 'react';

import { getApiErrorMessage } from '@/api/client';
import { eventApi } from '@/features/events/event-api';
import { useEventDraftStore } from '@/features/events/event-draft-store';
import type { Event } from '@/features/events/models/event-types';
import { colors } from '@/theme/tokens';

export function MyEventsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [optionsEvent, setOptionsEvent] = useState<Event | null>(null);
  const [deleteEvent, setDeleteEvent] = useState<Event | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const query = useQuery({
    queryFn: eventApi.getOwned,
    queryKey: ['my-events'],
  });

  const events = query.data ?? [];
  const draftEvents = events.filter((event) => event.status === 'draft');
  const activeEvents = events.filter((event) => event.status !== 'draft' && !isPast(event));
  const pastEvents = events.filter((event) => event.status !== 'draft' && isPast(event));
  const remove = useMutation({
    mutationFn: () => eventApi.remove(deleteEvent!.id),
    onError: (error) => setDeleteError(getApiErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
      setDeleteEvent(null);
      setDeleteError(null);
    },
  });

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
              onOptionsPress={setOptionsEvent}
              title="Ativos agora"
            />
            <EventSection
              events={pastEvents}
              onEventPress={(event) => router.push(`/(app)/events/${event.id}`)}
              onOptionsPress={setOptionsEvent}
              title="Passados"
            />
            <EventSection
              events={draftEvents}
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
        onConfirm={() => remove.mutate()}
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
    <Modal animationType="fade" onRequestClose={onClose} transparent visible={Boolean(event)}>
      <Pressable onPress={onClose} style={styles.modalOverlay}>
        <Pressable onPress={() => undefined} style={styles.optionsCard}>
          <View style={styles.optionsHeader}>
            <View style={styles.optionsIcon}>
              <Ionicons color={colors.primary} name="calendar-outline" size={20} />
            </View>
            <View style={styles.optionsHeading}>
              <Text numberOfLines={1} style={styles.optionsTitle}>
                {event?.name}
              </Text>
              <Text style={styles.optionsCopy}>Gerencie este evento</Text>
            </View>
            <Pressable accessibilityLabel="Fechar opções" hitSlop={8} onPress={onClose}>
              <Ionicons color={colors.mutedForeground} name="close" size={21} />
            </Pressable>
          </View>
          <View style={styles.optionsDivider} />
          <Pressable onPress={onEdit} style={styles.optionAction}>
            <View style={styles.optionActionIcon}>
              <Ionicons color={colors.foreground} name="create-outline" size={19} />
            </View>
            <View style={styles.optionActionText}>
              <Text style={styles.optionActionTitle}>Editar evento</Text>
              <Text style={styles.optionActionCopy}>Altere dados, tags e mídias</Text>
            </View>
            <Ionicons color={colors.mutedForeground} name="chevron-forward" size={18} />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.deleteAction}>
            <View style={styles.deleteActionIcon}>
              <Ionicons color="#FCA5A5" name="trash-outline" size={19} />
            </View>
            <View style={styles.optionActionText}>
              <Text style={styles.deleteActionTitle}>Excluir evento</Text>
              <Text style={styles.deleteActionCopy}>Essa ação não pode ser desfeita</Text>
            </View>
            <Ionicons color="#FCA5A5" name="chevron-forward" size={18} />
          </Pressable>
          <Pressable onPress={onClose} style={styles.cancelAction}>
            <Text style={styles.cancelActionLabel}>Cancelar</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
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
    <Modal animationType="fade" onRequestClose={onCancel} transparent visible={Boolean(event)}>
      <Pressable onPress={onCancel} style={styles.modalOverlay}>
        <Pressable
          onPress={(pressEvent) => pressEvent.stopPropagation()}
          style={styles.optionsCard}
        >
          <View style={styles.confirmIcon}>
            <Ionicons color="#FCA5A5" name="trash-outline" size={24} />
          </View>
          <Text style={styles.confirmTitle}>Excluir evento?</Text>
          <Text style={styles.confirmCopy}>
            O evento <Text style={styles.confirmEventName}>{event?.name}</Text> será removido
            permanentemente.
          </Text>
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
              <Text style={styles.confirmDeleteLabel}>
                {isDeleting ? 'Excluindo...' : 'Excluir'}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
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
  modalOverlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(0,0,0,0.62)',
    flex: 1,
    justifyContent: 'center' as const,
    padding: 24,
  },
  optionsCard: {
    backgroundColor: '#18181B',
    borderColor: colors.border,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 420,
    padding: 16,
    width: '100%' as const,
  },
  optionsHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10 },
  optionsIcon: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(159,255,139,0.12)',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center' as const,
    width: 40,
  },
  optionsHeading: { flex: 1, gap: 2, minWidth: 0 },
  optionsTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  optionsCopy: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  optionsDivider: { backgroundColor: colors.border, height: 1, marginVertical: 16 },
  optionAction: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 10,
    padding: 12,
  },
  optionActionIcon: {
    alignItems: 'center' as const,
    backgroundColor: '#3F3F46',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center' as const,
    width: 32,
  },
  optionActionText: { flex: 1, gap: 2 },
  optionActionTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  optionActionCopy: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  deleteAction: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(127,29,29,0.16)',
    borderColor: 'rgba(248,113,113,0.22)',
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 10,
    marginTop: 8,
    padding: 12,
  },
  deleteActionIcon: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(248,113,113,0.14)',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center' as const,
    width: 32,
  },
  deleteActionTitle: { color: '#FCA5A5', fontFamily: 'DMSans-Medium', fontSize: 14 },
  deleteActionCopy: { color: '#FDA4AF', fontFamily: 'DMSans-Regular', fontSize: 12 },
  cancelAction: { alignItems: 'center' as const, paddingTop: 16 },
  cancelActionLabel: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  confirmIcon: {
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
    backgroundColor: 'rgba(248,113,113,0.14)',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center' as const,
    marginBottom: 12,
    width: 56,
  },
  confirmTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    textAlign: 'center' as const,
  },
  confirmCopy: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  confirmEventName: { color: colors.foreground, fontFamily: 'DMSans-SemiBold' },
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
