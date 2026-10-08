import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@expo/ui/community/datetime-picker';
import { isAxiosError } from 'axios';
import { useRouter } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { BottomSheet } from '@/components/BottomSheet';
import { getApiErrorMessage } from '@/api/client';
import { colors } from '@/theme/tokens';
import { businessEditorApi } from '@/features/businesses/business-editor-api';
import {
  cleanupPreparedImage,
  prepareImageForUpload,
} from '@/features/businesses/image-upload-service';
import { eventApi } from '@/features/events/event-api';
import { EventTagsSheet } from '@/features/events/components/EventTagsSheet';
import { useEventDraftStore } from '@/features/events/event-draft-store';
import type { EventDraftMedia } from '@/features/events/event-draft-store';
import type { Event } from '@/features/events/models/event-types';
import { onboardingApi } from '@/features/onboarding/onboarding-api';
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
import { useSessionStore } from '@/stores/session-store';

export function NewEventScreen({ eventId }: { eventId?: string }) {
  const eventQuery = useQuery({
    enabled: Boolean(eventId),
    queryFn: () => eventApi.getOne(eventId!),
    queryKey: ['event', eventId],
  });

  if (eventId && eventQuery.isLoading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator color={colors.primary} />
        <Text style={styles.loadingText}>Carregando evento...</Text>
      </View>
    );
  }

  if (eventId && eventQuery.isError) {
    return (
      <View style={styles.loadingState}>
        <Text style={styles.loadingText}>Não foi possível carregar o evento.</Text>
        <Pressable onPress={() => void eventQuery.refetch()} style={styles.retryButton}>
          <Text style={styles.retryLabel}>Tentar novamente</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <EventForm
      eventId={eventId}
      initialEvent={eventQuery.data}
      key={eventQuery.data?.id ?? 'new-event'}
    />
  );
}

function EventForm({ eventId, initialEvent }: { eventId?: string; initialEvent?: Event }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const accountId = useSessionStore((state) => state.account?.id);
  const businessQuery = useQuery({
    enabled: Boolean(accountId),
    queryFn: () => businessEditorApi.getEditorData(accountId!),
    queryKey: ['business-editor', accountId],
  });
  const citiesQuery = useQuery({
    queryFn: onboardingApi.getCities,
    queryKey: ['onboarding', 'cities'],
    staleTime: 10 * 60_000,
  });
  const [name, setName] = useState(initialEvent?.name ?? '');
  const [description, setDescription] = useState(initialEvent?.description ?? '');
  const [startDate, setStartDate] = useState<Date | null>(
    initialEvent?.start_date ? new Date(initialEvent.start_date) : null,
  );
  const [endDate, setEndDate] = useState<Date | null>(
    initialEvent?.end_date ? new Date(initialEvent.end_date) : null,
  );
  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);
  const [pickerStep, setPickerStep] = useState<'date' | 'time'>('date');
  const [draftDate, setDraftDate] = useState<Date | null>(null);
  const [coverMedia, setCoverMedia] = useState<EventDraftMedia | null>(null);
  const [removedCoverMediaId, setRemovedCoverMediaId] = useState<string | null>(null);
  const mediaItems = useEventDraftStore((state) => state.media);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const [active, setActive] = useState(initialEvent?.active ?? true);
  const [regional, setRegional] = useState(initialEvent?.reach_level === 'regional');
  const [highlighted, setHighlighted] = useState(initialEvent?.type === 'featured');
  const [selectedCities, setSelectedCities] = useState<string[] | null>(
    initialEvent ? (initialEvent.cities?.map((city) => city.id) ?? []) : null,
  );
  const [selectedTags, setSelectedTags] = useState<OnboardingTag[]>(
    initialEvent?.tags?.map((tag) => ({ ...tag, group_id: '' })) ?? [],
  );
  const [tagsVisible, setTagsVisible] = useState(false);

  const availableCities = useMemo(() => {
    const locations = businessQuery.data?.profile.locations ?? [];
    const locationCityIds = new Set(
      locations.map((location) => location.city?.id).filter((id): id is string => Boolean(id)),
    );
    const locationNames = new Set(
      locations
        .map((location) => location.city?.name?.trim())
        .filter((name): name is string => Boolean(name)),
    );

    if (citiesQuery.data) {
      return citiesQuery.data.filter((city) =>
        locationCityIds.size ? locationCityIds.has(city.id) : locationNames.has(city.name.trim()),
      );
    }

    return Array.from(locationNames, (name) => ({ id: name, name }));
  }, [businessQuery.data?.profile.locations, citiesQuery.data]);

  const selectedCityIds = selectedCities ?? availableCities.map((city) => city.id);
  const existingMediaItems =
    initialEvent?.medias?.map((media) => ({
      name: media.url.split('/').pop() ?? 'Mídia do evento',
      uri: media.url,
    })) ?? [];
  const existingCover = initialEvent?.medias?.find((media) => media.is_cover);
  const currentCoverUri = coverMedia?.uri ?? (removedCoverMediaId ? null : existingCover?.url);
  const mediaGalleryItems = mediaItems.length
    ? mediaItems
    : coverMedia
      ? [coverMedia]
      : eventId
        ? existingMediaItems
        : [];

  async function pickCover() {
    const result = await pickImages(false);
    if (!result[0]) return;
    try {
      const prepared = await prepareImageForUpload(result[0], 'cover');
      if (coverMedia?.prepared) cleanupPreparedImage(coverMedia.prepared);
      setCoverMedia({ name: prepared.fileName, prepared, uri: prepared.uri });
      setRemovedCoverMediaId(null);
    } catch (error) {
      Alert.alert('Não foi possível preparar a capa', getApiErrorMessage(error));
    }
  }

  function toggleCity(cityId: string) {
    setSelectedCities((current) => {
      const selected = current ?? availableCities.map((item) => item.id);
      return selected.includes(cityId)
        ? selected.filter((item) => item !== cityId)
        : [...selected, cityId];
    });
  }

  const save = useMutation({
    mutationFn: (status: 'draft' | 'published') => saveEvent(status),
    onError: (error) =>
      Alert.alert('Não foi possível salvar o evento', getEventErrorMessage(error)),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['my-events'] });
      if (eventId) await queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      useEventDraftStore.getState().clear();
      if (coverMedia?.prepared) cleanupPreparedImage(coverMedia.prepared);
      mediaItems.forEach((item) => {
        if (item.prepared) cleanupPreparedImage(item.prepared);
      });
      router.back();
    },
  });

  async function saveEvent(status: 'draft' | 'published') {
    const validationError = validateEvent(status);
    if (validationError) throw new Error(validationError);
    const input = {
      active,
      city_ids: selectedCityIds,
      description: description.trim(),
      end_date: endDate?.toISOString(),
      name: name.trim(),
      reach_level: regional ? ('regional' as const) : ('local' as const),
      start_date: startDate?.toISOString(),
      status,
      tag_ids: selectedTags.map((tag) => tag.id),
      type: highlighted ? ('featured' as const) : ('simple' as const),
    };
    const event = eventId ? await eventApi.update(eventId, input) : await eventApi.create(input);
    await uploadPendingMedia(event.id);
    if (eventId && removedCoverMediaId) await eventApi.deleteMedia(eventId, removedCoverMediaId);
    return event;
  }

  function validateEvent(status: 'draft' | 'published') {
    if (name.trim().length < 4) return 'Informe um nome com pelo menos 4 caracteres.';
    if (description.trim().length > 300) return 'A descrição deve ter no máximo 300 caracteres.';
    if (!description.trim()) return 'Informe a descrição do evento.';
    if (status === 'published' && (!startDate || !endDate)) {
      return 'Informe a data e hora de início e fim.';
    }
    if (startDate && endDate && endDate <= startDate) {
      return 'A data de fim deve ser posterior à data de início.';
    }
    return null;
  }

  async function uploadPendingMedia(createdEventId: string) {
    const uploads = [
      ...(coverMedia ? [{ ...coverMedia, isCover: true, position: 0 }] : []),
      ...mediaItems.map((item, index) => ({ ...item, position: index + (coverMedia ? 1 : 0) })),
    ];
    for (const item of uploads) {
      await eventApi.uploadMedia(createdEventId, {
        fileName: item.prepared?.fileName ?? item.name,
        isCover: item.isCover,
        mimeType: item.prepared?.mimeType ?? item.mimeType ?? 'application/octet-stream',
        position: item.position,
        uri: item.prepared?.uri ?? item.uri,
      });
    }
  }

  function openDatePicker(target: 'start' | 'end') {
    const current = target === 'start' ? startDate : endDate;
    setDraftDate(current ?? new Date());
    setPickerStep('date');
    setPickerTarget(target);
  }

  function commitDate(value: Date) {
    if (pickerTarget === 'start') setStartDate(value);
    if (pickerTarget === 'end') setEndDate(value);
    setPickerTarget(null);
    setDraftDate(null);
  }

  function handlePickerValueChange(value: Date) {
    if (Platform.OS === 'android' && pickerStep === 'date') {
      const next = new Date(draftDate ?? new Date());
      next.setFullYear(value.getFullYear(), value.getMonth(), value.getDate());
      setDraftDate(next);
      setPickerStep('time');
      return;
    }

    if (Platform.OS === 'android' && pickerStep === 'time') {
      const next = new Date(draftDate ?? new Date());
      next.setHours(value.getHours(), value.getMinutes(), 0, 0);
      commitDate(next);
      return;
    }

    setDraftDate(value);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" hitSlop={8} onPress={() => router.back()}>
          <Ionicons color={colors.foreground} name="arrow-back" size={20} />
        </Pressable>
        <Text style={styles.title}>{eventId ? 'Editar Evento' : 'Novo Evento'}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <SectionTitle title="Dados básicos" />
        <Pressable onPress={pickCover} style={styles.coverPicker}>
          {currentCoverUri ? (
            <Image source={{ uri: currentCoverUri }} style={styles.coverImage} />
          ) : (
            <>
              <Ionicons color={colors.foreground} name="cloud-upload-outline" size={32} />
              <Text style={styles.coverHint}>Faça upload a imagem de capa</Text>
            </>
          )}
          {currentCoverUri ? (
            <>
              <View style={styles.replaceButton}>
                <Ionicons color={colors.background} name="cloud-upload-outline" size={16} />
                <Text style={styles.replaceLabel}>Substituir foto</Text>
              </View>
              <Pressable
                accessibilityLabel="Remover foto de capa"
                hitSlop={8}
                onPress={() => {
                  if (coverMedia?.prepared) cleanupPreparedImage(coverMedia.prepared);
                  setCoverMedia(null);
                  setRemovedCoverMediaId(existingCover?.id ?? null);
                }}
                style={styles.removeCoverButton}
              >
                <Ionicons color={colors.foreground} name="close" size={18} />
              </Pressable>
            </>
          ) : null}
        </Pressable>

        <Field label="Nome do evento" required>
          <TextInput
            maxLength={200}
            onChangeText={setName}
            placeholder="Ex: Feira de Artesanato"
            placeholderTextColor={colors.mutedForeground}
            style={styles.input}
            value={name}
          />
        </Field>
        <Field label="Descrição">
          <TextInput
            maxLength={300}
            multiline
            onChangeText={setDescription}
            placeholder="Descreva o evento em poucas linhas..."
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, styles.descriptionInput]}
            value={description}
          />
        </Field>
        <DateField
          label="Data/hora de início"
          value={startDate}
          onPress={() => openDatePicker('start')}
        />
        <DateField label="Data/hora de fim" value={endDate} onPress={() => openDatePicker('end')} />

        <SectionTitle title="Configurações" />
        <SwitchRow
          label="Evento Ativo"
          value={active}
          onPress={() => setActive((value) => !value)}
        />
        <SwitchRow
          label="Alcance Regional"
          value={regional}
          onPress={() => setRegional((value) => !value)}
          premium
        />
        <SwitchRow
          label="Destacar evento"
          value={highlighted}
          onPress={() => setHighlighted((value) => !value)}
          premium
        />

        <SectionTitle title="Tags" />
        <View style={styles.chips}>
          {selectedTags.map((tag) => (
            <View key={tag.id} style={styles.chip}>
              <Text style={styles.chipLabel}>{tag.name}</Text>
            </View>
          ))}
          <Pressable onPress={() => setTagsVisible(true)} style={styles.editChip}>
            <Ionicons color={colors.background} name="pencil" size={14} />
            <Text style={styles.editChipLabel}>Editar tags</Text>
          </Pressable>
        </View>

        <SectionTitle title="Cidades" />
        <View style={styles.cityList}>
          {availableCities.map((city) => {
            const selected = selectedCityIds.includes(city.id);
            return (
              <Pressable key={city.id} onPress={() => toggleCity(city.id)} style={styles.cityRow}>
                <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                  {selected ? (
                    <Ionicons color={colors.primaryForeground} name="checkmark" size={18} />
                  ) : null}
                </View>
                <Text style={styles.cityLabel}>{city.name}</Text>
              </Pressable>
            );
          })}
          {!businessQuery.isLoading && !citiesQuery.isLoading && !availableCities.length ? (
            <Text style={styles.emptyCities}>Nenhuma cidade cadastrada neste negócio.</Text>
          ) : null}
        </View>

        <SectionTitle title="Mídias (imagens e vídeos)" />
        <MediaCarousel
          activeIndex={activeMediaIndex}
          items={mediaGalleryItems}
          onChangeIndex={setActiveMediaIndex}
          onEdit={() =>
            router.push(
              eventId
                ? `/(app)/events/new/gallery?eventId=${eventId}`
                : '/(app)/events/new/gallery',
            )
          }
        />

        <View style={styles.divider} />
        <Pressable
          disabled={save.isPending}
          onPress={() => save.mutate('published')}
          style={[styles.createButton, save.isPending && styles.disabledButton]}
        >
          <Text style={styles.createLabel}>{eventId ? 'Salvar evento' : 'Criar evento'}</Text>
        </Pressable>
        <Pressable
          disabled={save.isPending}
          onPress={() => save.mutate('draft')}
          style={[styles.draftButton, save.isPending && styles.disabledButton]}
        >
          <Text style={styles.draftLabel}>{save.isPending ? 'Salvando...' : 'Criar rascunho'}</Text>
        </Pressable>
        <Text style={styles.footerHint}>
          Ao criar, o evento continuará disponível para edição posterior.
        </Text>
      </ScrollView>
      <EventTagsSheet
        onClose={() => setTagsVisible(false)}
        onSave={setSelectedTags}
        selectedTags={selectedTags}
        visible={tagsVisible}
      />
      <BottomSheet
        onClose={() => {
          setPickerTarget(null);
          setDraftDate(null);
        }}
        visible={pickerTarget !== null}
      >
        <Text style={styles.pickerTitle}>
          {pickerTarget === 'start' ? 'Data/hora de início' : 'Data/hora de fim'}
        </Text>
        <DateTimePicker
          accentColor={colors.primary}
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          is24Hour
          key={`${pickerTarget}-${pickerStep}`}
          mode={Platform.OS === 'ios' ? 'datetime' : pickerStep}
          negativeButton={{ label: 'Cancelar' }}
          onDismiss={() => {
            setPickerTarget(null);
            setDraftDate(null);
          }}
          onValueChange={(_, value) => handlePickerValueChange(value)}
          positiveButton={{ label: pickerStep === 'date' ? 'Continuar' : 'Confirmar' }}
          presentation="dialog"
          style={styles.nativePicker}
          themeVariant="dark"
          value={draftDate ?? new Date()}
        />
        {Platform.OS === 'ios' ? (
          <Pressable
            onPress={() => draftDate && commitDate(draftDate)}
            style={styles.pickerConfirmButton}
          >
            <Text style={styles.pickerConfirmLabel}>Confirmar</Text>
          </Pressable>
        ) : null}
      </BottomSheet>
    </View>
  );
}

async function pickImages(multiple: boolean, selectionLimit = 1) {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    Alert.alert('Permissão necessária', 'Permita o acesso às fotos para adicionar imagens.');
    return [];
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: !multiple,
    allowsMultipleSelection: multiple,
    mediaTypes: multiple ? ['images', 'videos'] : ['images'],
    quality: 1,
    selectionLimit,
  });
  return result.canceled ? [] : result.assets;
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function getEventErrorMessage(error: unknown) {
  if (error instanceof Error && !isAxiosError(error)) return error.message;
  if (isAxiosError(error) && error.response?.status === 403) {
    return 'Seu plano atual não permite eventos regionais ou destacados.';
  }
  if (isAxiosError(error) && error.response?.status === 404) {
    return 'O evento ou uma das relações selecionadas não foi encontrado.';
  }
  if (isAxiosError(error) && error.response?.status === 400) {
    return getApiErrorMessage(error);
  }
  return getApiErrorMessage(error);
}

function MediaCarousel({
  activeIndex,
  items,
  onChangeIndex,
  onEdit,
}: {
  activeIndex: number;
  items: Array<{ name: string; uri: string }>;
  onChangeIndex: (index: number) => void;
  onEdit: () => void;
}) {
  const { width } = useWindowDimensions();
  const carouselWidth = Math.max(width - 32, 1);
  const hasItems = items.length > 0;

  return (
    <View style={[styles.mediaCarousel, { width: carouselWidth }]}>
      {hasItems ? (
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(event) => {
            onChangeIndex(Math.round(event.nativeEvent.contentOffset.x / carouselWidth));
          }}
        >
          {items.map((item) => (
            <Image
              key={item.uri}
              resizeMode="cover"
              source={{ uri: item.uri }}
              style={[styles.mediaCarouselImage, { width: carouselWidth }]}
            />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.mediaEmpty}>
          <Ionicons color={colors.mutedForeground} name="images-outline" size={32} />
          <Text style={styles.mediaEmptyText}>Adicione imagens ou vídeos</Text>
        </View>
      )}
      <Pressable onPress={onEdit} style={styles.editGalleryButton}>
        <Ionicons color={colors.background} name="pencil" size={16} />
        <Text style={styles.editGalleryLabel}>Editar galeria de fotos</Text>
      </Pressable>
      {hasItems ? (
        <View style={styles.mediaIndicator}>
          {items.map((item, index) => (
            <View
              key={item.uri}
              style={[styles.indicatorDot, index === activeIndex && styles.activeIndicatorDot]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Field({
  children,
  label,
  required,
}: {
  children: React.ReactNode;
  label: string;
  required?: boolean;
}) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {required ? <Text style={styles.required}> *</Text> : null}
      </Text>
      {children}
    </View>
  );
}

function DateField({
  label,
  onPress,
  value,
}: {
  label: string;
  onPress: () => void;
  value: Date | null;
}) {
  return (
    <Field label={label} required>
      <Pressable onPress={onPress} style={styles.dateInput}>
        <Ionicons color={colors.foreground} name="calendar-outline" size={16} />
        <Text style={[styles.dateText, !value && styles.placeholder]}>
          {value ? formatDateTime(value) : 'Selecione a data e hora'}
        </Text>
      </Pressable>
    </Field>
  );
}

function formatDateTime(value: Date) {
  const pad = (part: number) => String(part).padStart(2, '0');
  return `${pad(value.getDate())}/${pad(value.getMonth() + 1)}/${value.getFullYear()} ${pad(value.getHours())}:${pad(value.getMinutes())}`;
}

function SwitchRow({
  label,
  onPress,
  premium,
  value,
}: {
  label: string;
  onPress: () => void;
  premium?: boolean;
  value: boolean;
}) {
  return (
    <Pressable onPress={onPress} style={styles.switchRow}>
      <View style={[styles.switch, value && styles.switchOn]}>
        <View style={[styles.switchThumb, value && styles.switchThumbOn]} />
      </View>
      <Text style={styles.switchLabel}>{label}</Text>
      {premium ? <Ionicons color={colors.primary} name="diamond-outline" size={16} /> : null}
    </Pressable>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  loadingState: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center' as const,
    padding: 24,
  },
  loadingText: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retryButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 20,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  retryLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  content: { gap: 12, padding: 16, paddingBottom: 28 },
  sectionTitle: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
    marginTop: 4,
  },
  coverPicker: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 12,
    height: 256,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  coverImage: { height: '100%' as const, width: '100%' as const },
  coverHint: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14, marginTop: 8 },
  replaceButton: {
    alignItems: 'center' as const,
    backgroundColor: '#F4F4F5',
    borderRadius: 32,
    flexDirection: 'row' as const,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute' as const,
    right: 8,
    top: 11,
  },
  replaceLabel: { color: colors.background, fontFamily: 'DMSans-Medium', fontSize: 12 },
  removeCoverButton: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(10,10,10,0.82)',
    borderRadius: 16,
    bottom: 10,
    height: 32,
    justifyContent: 'center' as const,
    position: 'absolute' as const,
    right: 10,
    width: 32,
  },
  field: { gap: 8 },
  label: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  required: { color: '#EF4444' },
  input: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 16,
    height: 40,
    paddingHorizontal: 16,
    paddingVertical: 0,
  },
  descriptionInput: { textAlignVertical: 'center' as const },
  dateInput: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 8,
    height: 40,
    paddingHorizontal: 10,
  },
  dateText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  placeholder: { color: colors.mutedForeground },
  pickerTitle: {
    color: colors.foreground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 18,
    marginBottom: 8,
  },
  nativePicker: { width: '100%' as const },
  pickerConfirmButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 44,
    justifyContent: 'center' as const,
    marginBottom: 8,
    marginTop: 12,
  },
  pickerConfirmLabel: {
    color: colors.primaryForeground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
  },
  switchRow: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 10,
    minHeight: 24,
  },
  switch: {
    backgroundColor: '#27272A',
    borderRadius: 20,
    height: 20,
    justifyContent: 'center' as const,
    padding: 2,
    width: 36,
  },
  switchOn: { backgroundColor: colors.primary },
  switchThumb: { backgroundColor: colors.foreground, borderRadius: 99, height: 16, width: 16 },
  switchThumbOn: { alignSelf: 'flex-end' as const, backgroundColor: colors.background },
  switchLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4 },
  chip: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  chipLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  editChip: {
    alignItems: 'center' as const,
    backgroundColor: '#F4F4F5',
    borderRadius: 32,
    flexDirection: 'row' as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  editChipLabel: { color: colors.background, fontFamily: 'DMSans-Medium', fontSize: 12 },
  cityList: { gap: 8 },
  cityRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 8 },
  checkbox: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 4,
    height: 20,
    justifyContent: 'center' as const,
    width: 20,
  },
  checkboxSelected: { backgroundColor: colors.primary },
  cityLabel: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  emptyCities: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  mediaImage: { borderRadius: 8, height: 40, width: 40 },
  mediaDetails: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    flex: 1,
    gap: 8,
    minWidth: 0,
  },
  mediaFileName: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 14 },
  mediaItem: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    width: '100%' as const,
  },
  removeMediaButton: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    padding: 4,
  },
  mediaUploadButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row' as const,
    gap: 8,
    height: 40,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
  },
  mediaUploadLabel: {
    color: colors.primaryForeground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 14,
  },
  mediaCarousel: {
    backgroundColor: '#27272A',
    borderRadius: 12,
    height: 256,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  mediaCarouselImage: { height: 256 },
  mediaEmpty: { alignItems: 'center' as const, flex: 1, gap: 8, justifyContent: 'center' as const },
  mediaEmptyText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  editGalleryButton: {
    alignItems: 'center' as const,
    backgroundColor: '#F4F4F5',
    borderRadius: 32,
    flexDirection: 'row' as const,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute' as const,
    right: 8,
    top: 11,
  },
  editGalleryLabel: { color: colors.background, fontFamily: 'DMSans-Medium', fontSize: 12 },
  mediaIndicator: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    borderRadius: 16,
    bottom: 8,
    flexDirection: 'row' as const,
    gap: 5,
    left: '50%' as const,
    padding: 4,
    position: 'absolute' as const,
    transform: [{ translateX: -36 }],
  },
  indicatorDot: { backgroundColor: colors.mutedForeground, borderRadius: 8, height: 10, width: 10 },
  activeIndicatorDot: { backgroundColor: colors.foreground, width: 30 },
  disabled: { opacity: 0.6 },
  divider: { backgroundColor: '#27272A', borderRadius: 50, height: 2, marginTop: 4 },
  createButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 40,
    justifyContent: 'center' as const,
  },
  createLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  draftButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1.6,
    height: 40,
    justifyContent: 'center' as const,
  },
  disabledButton: { opacity: 0.5 },
  draftLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 14 },
  footerHint: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    textAlign: 'center' as const,
  },
} as const;
