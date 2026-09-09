import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, Text, View } from 'react-native';

import { businessEditorApi, type BusinessMedia } from '@/features/businesses/business-editor-api';
import { invalidateBusinessCaches } from '@/features/businesses/business-cache';
import { FullScreenImageViewer } from '@/components/FullScreenImageViewer';
import {
  cleanupPreparedImage,
  prepareImageForUpload,
} from '@/features/businesses/image-upload-service';
import { useOwnedBusiness } from '@/features/businesses/use-owned-business';
import { colors } from '@/theme/tokens';

const MAX_GALLERY_IMAGES = 10;

export function BusinessGalleryScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const ownedBusiness = useOwnedBusiness();
  const businessId = ownedBusiness.data?.id;
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState<'idle' | 'processing' | 'uploading'>('idle');
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const uploadAbortController = useRef<AbortController | null>(null);
  const uploadCancelled = useRef(false);
  const gallery = useQuery({
    enabled: Boolean(businessId),
    queryFn: () => businessEditorApi.getMedia(businessId!),
    queryKey: ['business-gallery', businessId],
  });
  const media = useMemo(
    () =>
      [...(gallery.data ?? [])].sort((left, right) => (left.position ?? 0) - (right.position ?? 0)),
    [gallery.data],
  );
  const invalidate = () =>
    businessId ? invalidateBusinessCaches(queryClient, businessId) : Promise.resolve();
  const upload = useMutation({
    mutationFn: async (asset: ImagePicker.ImagePickerAsset) => {
      const prepared = await prepareImageForUpload(asset, 'content');
      setUploadStage('uploading');
      const controller = new AbortController();
      uploadAbortController.current = controller;
      try {
        return await businessEditorApi.uploadMedia(businessId!, prepared, {
          onProgress: setUploadProgress,
          signal: controller.signal,
        });
      } finally {
        if (uploadAbortController.current === controller) uploadAbortController.current = null;
        cleanupPreparedImage(prepared);
      }
    },
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (mediaId: string) => businessEditorApi.deleteMedia(businessId!, mediaId),
    onSuccess: invalidate,
  });
  const reorder = useMutation({
    mutationFn: (next: BusinessMedia[]) =>
      businessEditorApi.reorderMedia(
        businessId!,
        next.map((item) => item.id),
      ),
    onMutate: async (next) => {
      await queryClient.cancelQueries({ queryKey: ['business-gallery', businessId] });
      const previous = queryClient.getQueryData<BusinessMedia[]>(['business-gallery', businessId]);
      queryClient.setQueryData(['business-gallery', businessId], next);
      return { previous };
    },
    onError: (_error, _next, context) => {
      queryClient.setQueryData(['business-gallery', businessId], context?.previous);
      Alert.alert('Não foi possível reordenar', 'Tente novamente.');
    },
    onSuccess: invalidate,
  });

  async function selectImages() {
    const remaining = MAX_GALLERY_IMAGES - media.length;
    if (remaining <= 0) {
      Alert.alert(
        'Limite atingido',
        `Você pode adicionar até ${MAX_GALLERY_IMAGES} fotos à galeria.`,
      );
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso às fotos para enviar imagens à galeria.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsMultipleSelection: true,
      mediaTypes: ['images'],
      quality: 1,
      selectionLimit: remaining,
    });
    if (result.canceled) return;

    uploadCancelled.current = false;
    try {
      for (const asset of result.assets) {
        if (uploadCancelled.current) break;
        setUploadProgress(0);
        setUploadStage('processing');
        await upload.mutateAsync(asset);
      }
    } catch (error) {
      if (uploadCancelled.current) return;
      Alert.alert(
        'Não foi possível enviar todas as fotos',
        error instanceof Error ? error.message : 'Confira sua conexão e tente novamente.',
      );
    } finally {
      setUploadStage('idle');
    }
  }

  function cancelUpload() {
    uploadCancelled.current = true;
    uploadAbortController.current?.abort();
  }

  function move(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= media.length || reorder.isPending) return;
    const next = [...media];
    [next[index], next[destination]] = [next[destination], next[index]];
    reorder.mutate(next);
  }

  if (ownedBusiness.isLoading || gallery.isLoading) return <GalleryState loading />;
  if (!businessId || ownedBusiness.isError || gallery.isError)
    return <GalleryState error onRetry={() => gallery.refetch()} />;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable accessibilityLabel="Voltar" onPress={() => router.back()}>
          <Ionicons color={colors.foreground} name="arrow-back" size={25} />
        </Pressable>
        <Text style={styles.title}>Galeria de fotos</Text>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.intro}>
          <Text style={styles.heading}>Fotos da empresa</Text>
          <Text style={styles.copy}>
            A primeira foto é a capa da página pública. Organize a sequência com os controles de
            cada foto.
          </Text>
        </View>
        <View style={styles.imageTip}>
          <Ionicons color={colors.primary} name="information-circle-outline" size={20} />
          <Text style={styles.imageTipText}>
            Para evitar cortes, use fotos horizontais de pelo menos 1200 × 850 px (proporção
            1,41:1).
          </Text>
        </View>
        <Pressable
          disabled={uploadStage === 'processing'}
          onPress={uploadStage === 'uploading' ? cancelUpload : selectImages}
          style={[styles.uploadButton, uploadStage === 'processing' && styles.disabled]}
        >
          {uploadStage !== 'idle' ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Ionicons color={colors.primaryForeground} name="images-outline" size={21} />
          )}
          <Text style={styles.uploadLabel}>
            {uploadStage === 'processing'
              ? 'Otimizando foto…'
              : uploadStage === 'uploading'
                ? `Cancelar envio (${uploadProgress}%)`
                : 'Adicionar fotos'}
          </Text>
        </Pressable>
        {media.length ? (
          <View style={styles.list}>
            {media.map((item, index) => (
              <GalleryCard
                index={index}
                key={item.id}
                media={item}
                onDelete={() =>
                  Alert.alert('Remover foto?', 'Ela deixará de aparecer na página pública.', [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Remover',
                      style: 'destructive',
                      onPress: () => remove.mutate(item.id),
                    },
                  ])
                }
                onMoveBackward={() => move(index, -1)}
                onMoveForward={() => move(index, 1)}
                onOpen={() => setViewerIndex(index)}
                canMoveBackward={index > 0}
                canMoveForward={index < media.length - 1}
                deleting={remove.isPending}
              />
            ))}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons color={colors.mutedForeground} name="images-outline" size={42} />
            <Text style={styles.emptyTitle}>Sua galeria ainda está vazia</Text>
            <Text style={styles.emptyCopy}>Adicione fotos para destacar o seu negócio.</Text>
          </View>
        )}
      </ScrollView>
      <FullScreenImageViewer
        images={media.map((item) => item.url)}
        initialIndex={viewerIndex ?? 0}
        onClose={() => setViewerIndex(null)}
        visible={viewerIndex !== null}
      />
    </View>
  );
}

function GalleryCard({
  canMoveBackward,
  canMoveForward,
  deleting,
  index,
  media,
  onDelete,
  onMoveBackward,
  onMoveForward,
  onOpen,
}: {
  canMoveBackward: boolean;
  canMoveForward: boolean;
  deleting: boolean;
  index: number;
  media: BusinessMedia;
  onDelete: () => void;
  onMoveBackward: () => void;
  onMoveForward: () => void;
  onOpen: () => void;
}) {
  return (
    <View style={[styles.mediaCard, index === 0 && styles.coverCard]}>
      <Pressable accessibilityLabel={`Visualizar foto ${index + 1}`} onPress={onOpen}>
        <Image
          source={{ uri: media.url }}
          style={[styles.mediaImage, index === 0 && styles.coverImage]}
        />
      </Pressable>
      {index === 0 ? (
        <View style={styles.coverBadge}>
          <Ionicons color={colors.primaryForeground} name="star" size={12} />
          <Text style={styles.coverLabel}>Capa</Text>
        </View>
      ) : null}
      <View style={styles.mediaContent}>
        <Text style={styles.mediaTitle}>
          {index === 0 ? 'Capa da página pública' : `Foto ${index + 1}`}
        </Text>
        <Text style={styles.mediaDescription}>
          {index === 0 ? 'Esta é a primeira imagem exibida.' : `Posição ${index + 1} na galeria.`}
        </Text>
        <View style={styles.orderControls}>
          <Pressable
            accessibilityLabel="Mover foto para cima"
            disabled={!canMoveBackward}
            onPress={onMoveBackward}
            style={[styles.orderButton, !canMoveBackward && styles.disabled]}
          >
            <Ionicons color={colors.foreground} name="arrow-up" size={17} />
          </Pressable>
          <Pressable
            accessibilityLabel="Mover foto para baixo"
            disabled={!canMoveForward}
            onPress={onMoveForward}
            style={[styles.orderButton, !canMoveForward && styles.disabled]}
          >
            <Ionicons color={colors.foreground} name="arrow-down" size={17} />
          </Pressable>
        </View>
      </View>
      <Pressable
        accessibilityLabel="Remover foto"
        disabled={deleting}
        onPress={onDelete}
        style={[styles.deleteButton, deleting && styles.disabled]}
      >
        <Ionicons color={colors.foreground} name="trash-outline" size={17} />
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
        <Ionicons color={colors.mutedForeground} name="alert-circle-outline" size={42} />
      )}
      <Text style={styles.copy}>
        {loading ? 'Carregando galeria…' : 'Não foi possível carregar a galeria.'}
      </Text>
      {error && onRetry ? (
        <Pressable onPress={onRetry}>
          <Text style={styles.retry}>Tentar novamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  header: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 52,
  },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  content: { gap: 24, padding: 16, paddingBottom: 40 },
  intro: { gap: 6 },
  heading: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  copy: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  imageTip: {
    alignItems: 'flex-start' as const,
    backgroundColor: 'rgba(159,255,139,0.08)',
    borderRadius: 10,
    flexDirection: 'row' as const,
    gap: 8,
    padding: 12,
  },
  imageTipText: {
    color: colors.foreground,
    flex: 1,
    fontFamily: 'DMSans-Regular',
    fontSize: 13,
    lineHeight: 18,
  },
  uploadButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row' as const,
    gap: 8,
    height: 48,
    justifyContent: 'center' as const,
  },
  uploadLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  list: { gap: 12 },
  mediaCard: {
    backgroundColor: '#18181B',
    borderRadius: 12,
    flexDirection: 'row' as const,
    minHeight: 108,
    overflow: 'hidden' as const,
    position: 'relative' as const,
  },
  coverCard: { minHeight: 188 },
  mediaImage: { backgroundColor: '#27272A', height: 108, width: 108 },
  coverImage: { height: 188, width: 168 },
  mediaContent: {
    flex: 1,
    gap: 4,
    justifyContent: 'center' as const,
    paddingHorizontal: 12,
    paddingRight: 42,
  },
  coverBadge: {
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: 'row' as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 5,
    position: 'absolute' as const,
    left: 8,
    top: 8,
  },
  coverLabel: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 11 },
  mediaTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 15 },
  mediaDescription: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 12,
    lineHeight: 17,
  },
  deleteButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 18,
    height: 32,
    justifyContent: 'center' as const,
    position: 'absolute' as const,
    right: 10,
    top: 10,
    width: 32,
  },
  orderControls: {
    flexDirection: 'row' as const,
    gap: 6,
    marginTop: 8,
  },
  orderButton: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderRadius: 16,
    height: 32,
    justifyContent: 'center' as const,
    width: 32,
  },
  empty: {
    alignItems: 'center' as const,
    backgroundColor: '#18181B',
    borderRadius: 12,
    gap: 8,
    padding: 32,
  },
  emptyTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  emptyCopy: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    textAlign: 'center' as const,
  },
  state: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center' as const,
    padding: 24,
  },
  retry: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  disabled: { opacity: 0.5 },
} as const;
