import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import {
  cleanupPreparedImage,
  prepareImageForUpload,
} from '@/features/businesses/image-upload-service';
import { useEventDraftStore, type EventDraftMedia } from '@/features/events/event-draft-store';
import { eventApi } from '@/features/events/event-api';
import type { EventMedia } from '@/features/events/models/event-types';
import { colors } from '@/theme/tokens';

const MAX_EVENT_MEDIA = 10;

export function EventGalleryScreen() {
  const router = useRouter();
  const { eventId } = useLocalSearchParams<{ eventId?: string }>();
  const queryClient = useQueryClient();
  const localMedia = useEventDraftStore((state) => state.media);
  const addMedia = useEventDraftStore((state) => state.addMedia);
  const removeMedia = useEventDraftStore((state) => state.removeMedia);
  const reorderMedia = useEventDraftStore((state) => state.reorderMedia);
  const [processing, setProcessing] = useState(false);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const cancelled = useRef(false);
  const galleryQuery = useQuery({
    enabled: Boolean(eventId),
    queryFn: () => eventApi.getMedia(eventId!),
    queryKey: ['event-gallery', eventId],
  });
  const media = eventId
    ? [...(galleryQuery.data ?? [])].sort(
        (left, right) => (left.position ?? 0) - (right.position ?? 0),
      )
    : localMedia;
  const galleryItems = eventId
    ? (media as EventMedia[]).map((item) => ({
        ...item,
        name: item.url.split('/').pop() ?? `Mídia ${item.position ?? 0}`,
        uri: item.url,
      }))
    : localMedia;

  async function selectImages() {
    const remaining = MAX_EVENT_MEDIA - media.length;
    if (remaining <= 0) {
      Alert.alert('Limite atingido', `Você pode adicionar até ${MAX_EVENT_MEDIA} mídias.`);
      return;
    }
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Permita o acesso às fotos para adicionar mídias.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images', 'videos'],
      quality: 1,
      selectionLimit: remaining,
    });
    if (result.canceled) return;

    cancelled.current = false;
    setProcessing(true);
    const preparedMedia: EventDraftMedia[] = [];
    try {
      for (const asset of result.assets) {
        if (cancelled.current) break;
        if (eventId) {
          if (asset.type === 'video') {
            if (!isAllowedVideo(asset.mimeType, asset.fileName, asset.fileSize)) {
              throw new Error('Escolha um vídeo MP4 ou WebM com até 50 MB.');
            }
            await eventApi.uploadMedia(eventId, {
              fileName: asset.fileName ?? `video-${Date.now()}.mp4`,
              mimeType: asset.mimeType ?? 'video/mp4',
              position: media.length + preparedMedia.length,
              uri: asset.uri,
            });
          } else {
            const prepared = await prepareImageForUpload(asset, 'content');
            await eventApi.uploadMedia(eventId, {
              fileName: prepared.fileName,
              mimeType: prepared.mimeType,
              position: media.length + preparedMedia.length,
              uri: prepared.uri,
            });
            cleanupPreparedImage(prepared);
          }
        } else if (asset.type === 'video') {
          if (!isAllowedVideo(asset.mimeType, asset.fileName, asset.fileSize)) {
            throw new Error('Escolha um vídeo MP4 ou WebM com até 50 MB.');
          }
          preparedMedia.push({
            isVideo: true,
            mimeType: asset.mimeType ?? 'video/mp4',
            name: asset.fileName ?? `video-${Date.now()}.mp4`,
            uri: asset.uri,
          });
        } else {
          const prepared = await prepareImageForUpload(asset, 'content');
          preparedMedia.push({ name: prepared.fileName, prepared, uri: prepared.uri });
        }
      }
      if (preparedMedia.length) addMedia(preparedMedia);
      if (eventId) await queryClient.invalidateQueries({ queryKey: ['event-gallery', eventId] });
    } catch (error) {
      Alert.alert(
        'Não foi possível preparar a mídia',
        error instanceof Error ? error.message : 'Escolha outra imagem e tente novamente.',
      );
    } finally {
      setProcessing(false);
    }
  }

  function remove(index: number) {
    if (eventId) {
      const item = media[index] as EventMedia;
      if (item?.id) {
        void eventApi
          .deleteMedia(eventId, item.id)
          .then(() => queryClient.invalidateQueries({ queryKey: ['event-gallery', eventId] }));
      }
      return;
    }
    const item = removeMedia(index);
    if (item?.prepared) cleanupPreparedImage(item.prepared);
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= media.length) return;
    if (eventId) {
      const next = [...(media as EventMedia[])];
      [next[index], next[destination]] = [next[destination], next[index]];
      void eventApi
        .reorderMedia(
          eventId,
          next.map((item) => item.id).filter((id): id is string => Boolean(id)),
        )
        .then(() => queryClient.invalidateQueries({ queryKey: ['event-gallery', eventId] }));
      return;
    }
    reorderMedia(index, destination);
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable
          accessibilityLabel="Voltar"
          onPress={() => {
            if (router.canGoBack()) router.back();
            else if (eventId) router.replace(`/(app)/events/edit/${eventId}`);
            else router.replace('/(app)/events/new');
          }}
        >
          <Ionicons color={colors.foreground} name="arrow-back" size={25} />
        </Pressable>
        <Text style={styles.title}>Galeria de mídias</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.heading}>Mídias do evento</Text>
          <Text style={styles.copy}>
            Organize as imagens e vídeos do evento. A primeira mídia será usada como capa.
          </Text>
        </View>
        <Pressable
          onPress={
            processing
              ? () => {
                  cancelled.current = true;
                  setProcessing(false);
                }
              : selectImages
          }
          style={[styles.uploadButton, processing && styles.disabled]}
        >
          {processing ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Ionicons color={colors.primaryForeground} name="images-outline" size={21} />
          )}
          <Text style={styles.uploadLabel}>
            {processing ? 'Cancelar otimização' : 'Adicionar mídias'}
          </Text>
        </Pressable>
        {galleryItems.length ? (
          <View style={styles.list}>
            {galleryItems.map((item, index) => (
              <View
                key={`${item.uri}-${index}`}
                style={[styles.mediaCard, index === 0 && styles.coverCard]}
              >
                <Pressable
                  accessibilityLabel={`Visualizar mídia ${index + 1}`}
                  onPress={() => setViewerIndex(index)}
                >
                  {isVideoMedia(item) ? (
                    <View style={[styles.mediaImage, styles.videoPlaceholder]}>
                      <Ionicons color={colors.foreground} name="play-circle-outline" size={28} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: item.uri }}
                      style={[styles.mediaImage, index === 0 && styles.coverImage]}
                    />
                  )}
                </Pressable>
                {index === 0 ? (
                  <View style={styles.coverBadge}>
                    <Ionicons color={colors.primaryForeground} name="star" size={12} />
                    <Text style={styles.coverLabel}>Capa</Text>
                  </View>
                ) : null}
                <View style={styles.mediaContent}>
                  <Text numberOfLines={1} style={styles.mediaTitle}>
                    {item.name}
                  </Text>
                  <Text style={styles.mediaDescription}>Posição {index + 1} na galeria.</Text>
                  <View style={styles.orderControls}>
                    <Pressable
                      accessibilityLabel="Mover mídia para cima"
                      disabled={index === 0}
                      onPress={() => move(index, -1)}
                      style={[styles.orderButton, index === 0 && styles.disabled]}
                    >
                      <Ionicons color={colors.foreground} name="arrow-up" size={17} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Mover mídia para baixo"
                      disabled={index === media.length - 1}
                      onPress={() => move(index, 1)}
                      style={[styles.orderButton, index === media.length - 1 && styles.disabled]}
                    >
                      <Ionicons color={colors.foreground} name="arrow-down" size={17} />
                    </Pressable>
                  </View>
                </View>
                <Pressable
                  accessibilityLabel="Remover mídia"
                  onPress={() => remove(index)}
                  style={styles.deleteButton}
                >
                  <Ionicons color={colors.foreground} name="trash-outline" size={17} />
                </Pressable>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons color={colors.mutedForeground} name="images-outline" size={42} />
            <Text style={styles.emptyTitle}>A galeria ainda está vazia</Text>
            <Text style={styles.emptyCopy}>Adicione fotos para destacar o seu evento.</Text>
          </View>
        )}
      </ScrollView>
      <FullScreenImageViewer
        images={galleryItems.filter((item) => !isVideoMedia(item)).map((item) => item.uri)}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        visible={viewerIndex !== null}
      />
    </View>
  );
}

function isVideoMedia(item: { media_type?: string; isVideo?: boolean }) {
  return item.isVideo || item.media_type?.startsWith('video');
}

function isAllowedVideo(mimeType?: string, fileName?: string | null, fileSize?: number) {
  const mime = mimeType?.toLowerCase();
  const name = fileName?.toLowerCase();
  return (
    ((!fileSize || fileSize <= 50 * 1024 * 1024) && mime === 'video/mp4') ||
    mime === 'video/webm' ||
    name?.endsWith('.mp4') === true ||
    name?.endsWith('.webm') === true
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  content: { gap: 20, padding: 16, paddingBottom: 32 },
  intro: { gap: 8 },
  heading: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  copy: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  uploadButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row' as const,
    gap: 8,
    height: 44,
    justifyContent: 'center' as const,
    paddingHorizontal: 16,
  },
  uploadLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  list: { gap: 12 },
  mediaCard: {
    alignItems: 'center' as const,
    backgroundColor: '#18181B',
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 12,
    minHeight: 80,
    overflow: 'hidden' as const,
    padding: 8,
    position: 'relative' as const,
  },
  coverCard: { borderColor: colors.primary, borderWidth: 1 },
  mediaImage: { borderRadius: 8, height: 80, width: 80 },
  videoPlaceholder: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    justifyContent: 'center' as const,
  },
  coverImage: { borderRadius: 8 },
  coverBadge: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 3,
    left: 12,
    paddingHorizontal: 6,
    paddingVertical: 3,
    position: 'absolute' as const,
    top: 12,
  },
  coverLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 10 },
  mediaContent: { flex: 1, gap: 4, minWidth: 0 },
  mediaTitle: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  mediaDescription: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  orderControls: { flexDirection: 'row' as const, gap: 8 },
  orderButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 16,
    height: 28,
    justifyContent: 'center' as const,
    width: 28,
  },
  deleteButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 18,
    height: 32,
    justifyContent: 'center' as const,
    width: 32,
  },
  empty: { alignItems: 'center' as const, gap: 8, paddingVertical: 48 },
  emptyTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  emptyCopy: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  disabled: { opacity: 0.5 },
} as const;
