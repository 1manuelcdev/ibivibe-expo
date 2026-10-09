import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { getApiErrorMessage } from '@/api/client';
import { ActionModal, ActionModalItem } from '@/components/ActionModal';
import { AppBackButton } from '@/components/AppBackButton';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import { adminApi, type AdminCityMedia } from '@/features/admin/admin-api';
import {
  cleanupPreparedImage,
  prepareImageForUpload,
} from '@/features/businesses/image-upload-service';
import { isAdminAccount } from '@/features/admin/admin-access';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

const MAX_MEDIA = 10;

export function AdminCityGalleryScreen() {
  const { cityId } = useLocalSearchParams<{ cityId: string }>();
  const account = useSessionStore((state) => state.account);
  const queryClient = useQueryClient();
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<AdminCityMedia | null>(null);
  const [uploading, setUploading] = useState(false);
  const gallery = useQuery({
    enabled: Boolean(cityId),
    queryFn: () => adminApi.getCityMedia(cityId),
    queryKey: ['admin', 'city-media', cityId],
  });
  const media = useMemo(
    () =>
      [...(gallery.data ?? [])].sort((left, right) => (left.position ?? 0) - (right.position ?? 0)),
    [gallery.data],
  );
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'city-media', cityId] });
  const remove = useMutation({
    mutationFn: (mediaId: string) => adminApi.deleteCityMedia(cityId, mediaId),
    onError: (error) => Alert.alert('Não foi possível excluir a mídia', getApiErrorMessage(error)),
    onSuccess: async () => {
      setPendingDelete(null);
      await invalidate();
    },
  });
  const update = useMutation({
    mutationFn: ({ mediaId, isCover }: { isCover: boolean; mediaId: string }) =>
      adminApi.updateCityMedia(cityId, mediaId, { is_cover: isCover }),
    onError: (error) => Alert.alert('Não foi possível atualizar a capa', getApiErrorMessage(error)),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (items: AdminCityMedia[]) =>
      adminApi.reorderCityMedia(
        cityId,
        items.map((item) => item.id),
      ),
    onMutate: async (items) => {
      await queryClient.cancelQueries({ queryKey: ['admin', 'city-media', cityId] });
      const previous = queryClient.getQueryData<AdminCityMedia[]>(['admin', 'city-media', cityId]);
      queryClient.setQueryData(['admin', 'city-media', cityId], items);
      return { previous };
    },
    onError: (error, _items, context) => {
      queryClient.setQueryData(['admin', 'city-media', cityId], context?.previous);
      Alert.alert('Não foi possível reordenar as mídias', getApiErrorMessage(error));
    },
    onSuccess: invalidate,
  });

  async function selectMedia() {
    const remaining = MAX_MEDIA - media.length;
    if (remaining <= 0) {
      Alert.alert('Limite atingido', `Você pode adicionar até ${MAX_MEDIA} mídias.`);
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

    setUploading(true);
    try {
      for (const [index, asset] of result.assets.entries()) {
        if (asset.type === 'video') {
          if (!isAllowedVideo(asset.mimeType, asset.fileName, asset.fileSize)) {
            throw new Error('Escolha um vídeo MP4 ou WebM com até 50 MB.');
          }
          await adminApi.uploadCityMedia(cityId, {
            fileName: asset.fileName ?? `video-${Date.now()}.mp4`,
            isCover: media.length + index === 0,
            mimeType: asset.mimeType ?? 'video/mp4',
            position: media.length + index,
            uri: asset.uri,
          });
          continue;
        }
        const prepared = await prepareImageForUpload(asset, 'content');
        try {
          await adminApi.uploadCityMedia(cityId, {
            ...prepared,
            isCover: media.length + index === 0,
            position: media.length + index,
          });
        } finally {
          cleanupPreparedImage(prepared);
        }
      }
      await invalidate();
    } catch (error) {
      Alert.alert('Não foi possível enviar as mídias', getApiErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= media.length || reorder.isPending) return;
    const next = [...media];
    [next[index], next[destination]] = [next[destination], next[index]];
    reorder.mutate(next);
  }

  if (!isAdminAccount(account)) return null;
  if (gallery.isLoading) return <GalleryState loading />;
  if (gallery.isError) return <GalleryState error onRetry={() => gallery.refetch()} />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <AppBackButton
          fallbackHref={{ pathname: '/(app)/admin/cities/[cityId]', params: { cityId } }}
        />
        <Text style={styles.title}>Galeria de mídias</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.heading}>Mídias da cidade</Text>
          <Text style={styles.copy}>
            Defina a capa e organize a ordem em que as mídias aparecem.
          </Text>
        </View>
        <Pressable
          disabled={uploading}
          onPress={selectMedia}
          style={[styles.uploadButton, uploading && styles.disabled]}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Ionicons color={colors.primaryForeground} name="images-outline" size={21} />
          )}
          <Text style={styles.uploadLabel}>
            {uploading ? 'Enviando mídias…' : 'Adicionar mídias'}
          </Text>
        </Pressable>
        {media.length ? (
          <View style={styles.list}>
            {media.map((item, index) => (
              <MediaCard
                canMoveDown={index < media.length - 1}
                canMoveUp={index > 0}
                isCover={item.is_cover === true}
                item={item}
                key={item.id}
                onDelete={() => setPendingDelete(item)}
                onMoveDown={() => move(index, 1)}
                onMoveUp={() => move(index, -1)}
                onOpen={() => setViewerIndex(index)}
                onSetCover={() => update.mutate({ isCover: true, mediaId: item.id })}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons color={colors.mutedForeground} name="images-outline" size={42} />
            <Text style={styles.emptyTitle}>A galeria ainda está vazia</Text>
            <Text style={styles.emptyCopy}>Adicione mídias para destacar a cidade.</Text>
          </View>
        )}
      </ScrollView>
      <FullScreenImageViewer
        images={media.filter((item) => !isVideo(item)).map((item) => item.url)}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        visible={viewerIndex !== null}
      />
      <ActionModal
        description="Ela deixará de aparecer na página pública."
        onClose={() => setPendingDelete(null)}
        title="Excluir mídia?"
        visible={Boolean(pendingDelete)}
      >
        <ActionModalItem
          destructive
          disabled={remove.isPending}
          icon="trash-outline"
          onPress={() => pendingDelete && remove.mutate(pendingDelete.id)}
          title={remove.isPending ? 'Excluindo…' : 'Excluir mídia'}
        />
      </ActionModal>
    </View>
  );
}

function MediaCard({
  canMoveDown,
  canMoveUp,
  isCover,
  item,
  onDelete,
  onMoveDown,
  onMoveUp,
  onOpen,
  onSetCover,
}: {
  canMoveDown: boolean;
  canMoveUp: boolean;
  isCover: boolean;
  item: AdminCityMedia;
  onDelete: () => void;
  onMoveDown: () => void;
  onMoveUp: () => void;
  onOpen: () => void;
  onSetCover: () => void;
}) {
  return (
    <View style={[styles.mediaCard, isCover && styles.coverCard]}>
      <Pressable onPress={onOpen}>
        {isVideo(item) ? (
          <View style={[styles.image, styles.video]}>
            <Ionicons color={colors.foreground} name="play-circle-outline" size={30} />
          </View>
        ) : (
          <Image source={{ uri: item.url }} style={styles.image} />
        )}
      </Pressable>
      {isCover ? (
        <View style={styles.coverBadge}>
          <Ionicons color={colors.primaryForeground} name="star" size={12} />
          <Text style={styles.coverLabel}>Capa</Text>
        </View>
      ) : null}
      <View style={styles.mediaInfo}>
        <Text numberOfLines={1} style={styles.mediaName}>
          {item.url.split('/').pop() ?? 'Mídia'}
        </Text>
        <View style={styles.controls}>
          <Pressable
            accessibilityLabel="Mover mídia para cima"
            disabled={!canMoveUp}
            onPress={onMoveUp}
            style={[styles.control, !canMoveUp && styles.disabled]}
          >
            <Ionicons color={colors.foreground} name="arrow-up" size={16} />
          </Pressable>
          <Pressable
            accessibilityLabel="Mover mídia para baixo"
            disabled={!canMoveDown}
            onPress={onMoveDown}
            style={[styles.control, !canMoveDown && styles.disabled]}
          >
            <Ionicons color={colors.foreground} name="arrow-down" size={16} />
          </Pressable>
          {!isCover ? (
            <Pressable onPress={onSetCover} style={styles.coverButton}>
              <Text style={styles.coverButtonLabel}>Definir capa</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
      <Pressable accessibilityLabel="Excluir mídia" onPress={onDelete} style={styles.delete}>
        <Ionicons color="#FCA5A5" name="trash-outline" size={18} />
      </Pressable>
    </View>
  );
}

function GalleryState({
  error,
  loading,
  onRetry,
}: {
  error?: boolean;
  loading?: boolean;
  onRetry?: () => void;
}) {
  return (
    <View style={styles.state}>
      {loading ? (
        <ActivityIndicator color={colors.primary} />
      ) : (
        <>
          <Text style={styles.stateText}>Não foi possível carregar as mídias.</Text>
          {error && onRetry ? (
            <Pressable onPress={onRetry}>
              <Text style={styles.retry}>Tentar novamente</Text>
            </Pressable>
          ) : null}
        </>
      )}
    </View>
  );
}

function isVideo(item: { media_type?: string }) {
  return item.media_type?.startsWith('video') ?? false;
}
function isAllowedVideo(mimeType?: string, fileName?: string | null, fileSize?: number) {
  const mime = mimeType?.toLowerCase();
  const name = fileName?.toLowerCase();
  return (
    (!fileSize || fileSize <= 50 * 1024 * 1024) &&
    (mime === 'video/mp4' ||
      mime === 'video/webm' ||
      name?.endsWith('.mp4') === true ||
      name?.endsWith('.webm') === true)
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  content: { gap: 20, padding: 24, paddingBottom: 40 },
  intro: { gap: 6 },
  heading: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 17 },
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
    height: 46,
    justifyContent: 'center' as const,
  },
  uploadLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  list: { gap: 12 },
  mediaCard: {
    alignItems: 'center' as const,
    backgroundColor: '#18181B',
    borderRadius: 12,
    flexDirection: 'row' as const,
    gap: 10,
    minHeight: 92,
    padding: 8,
    position: 'relative' as const,
  },
  coverCard: { borderColor: colors.primary, borderWidth: 1 },
  image: { borderRadius: 8, height: 76, width: 76 },
  video: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    justifyContent: 'center' as const,
  },
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
  mediaInfo: { flex: 1, gap: 10, minWidth: 0 },
  mediaName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 13 },
  controls: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 6 },
  control: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 15,
    height: 30,
    justifyContent: 'center' as const,
    width: 30,
  },
  coverButton: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  coverButtonLabel: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 11 },
  delete: {
    alignItems: 'center' as const,
    height: 32,
    justifyContent: 'center' as const,
    width: 28,
  },
  empty: { alignItems: 'center' as const, gap: 8, paddingVertical: 52 },
  emptyTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  emptyCopy: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  disabled: { opacity: 0.5 },
  state: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center' as const,
    padding: 24,
  },
  stateText: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  retry: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14, padding: 8 },
} as const;
