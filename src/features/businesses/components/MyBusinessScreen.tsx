import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  ScrollView,
  type StyleProp,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';

import {
  businessEditorApi,
  type BusinessContactUpdate,
  type BusinessProfileUpdate,
} from '@/features/businesses/business-editor-api';
import { invalidateBusinessCaches } from '@/features/businesses/business-cache';
import {
  cleanupPreparedImage,
  prepareImageForUpload,
} from '@/features/businesses/image-upload-service';
import { BottomSheet } from '@/components/BottomSheet';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

type SaveStatus = 'idle' | 'dirty' | 'saved';

const facilities = [
  ['wifi', 'Wi-Fi'],
  ['parking', 'Estacionamento'],
  ['accessibility', 'Acessibilidade'],
] as const;

export function MyBusinessScreen() {
  const router = useRouter();
  const accountId = useSessionStore((state) => state.account?.id);
  const query = useQuery({
    enabled: Boolean(accountId),
    queryFn: () => businessEditorApi.getEditorData(accountId!),
    queryKey: ['business-editor', accountId],
  });

  if (query.isLoading) return <MyBusinessSkeleton />;
  if (query.isError || !query.data)
    return (
      <ScreenState
        icon="alert-circle-outline"
        text="Não foi possível carregar seu negócio."
        onRetry={() => query.refetch()}
      />
    );

  return (
    <BusinessEditor
      key={`${query.data.business.id}-${query.data.profile.tags?.join(',') ?? ''}`}
      data={query.data}
      onBack={() => router.back()}
    />
  );
}

function BusinessEditor({
  data,
  onBack,
}: {
  data: Awaited<ReturnType<typeof businessEditorApi.getEditorData>>;
  onBack: () => void;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const businessId = data.business.id;
  const [profile, setProfile] = useState<BusinessProfileUpdate>({
    commercial_name: data.profile.commercial_name ?? data.profile.name ?? '',
    // `bio` pertence à conta. Mantemos a leitura como fallback apenas para
    // negócios legados; ao salvar, a descrição passa a viver na empresa.
    description: data.profile.description ?? data.profile.bio ?? '',
    ...facilities.reduce(
      (values, [key]) => ({
        ...values,
        [key]: Boolean((data.profile as Record<string, unknown>)[key]),
      }),
      {},
    ),
  });
  const [contact, setContact] = useState<BusinessContactUpdate>({
    facebook: data.profile.contact?.facebook ?? '',
    instagram: data.profile.contact?.instagram ?? '',
    phone: data.profile.contact?.phone ?? '',
    public_email: data.profile.contact?.public_email ?? '',
    website: data.profile.contact?.website ?? '',
    whatsapp: data.profile.contact?.whatsapp ?? '',
  });
  const selectedTags = data.tags.filter((tag) => data.profile.tags?.includes(tag.name)).slice(0, 4);
  const visibleProfileTags = selectedTags.slice(0, 1);
  const hiddenProfileTags = selectedTags.length - visibleProfileTags.length;
  const [editor, setEditor] = useState<'profile' | 'description' | 'contact' | 'facilities' | null>(
    null,
  );
  const [descriptionStatus, setDescriptionStatus] = useState<SaveStatus>('idle');
  const [contactStatus, setContactStatus] = useState<SaveStatus>('idle');
  const [facilitiesStatus, setFacilitiesStatus] = useState<SaveStatus>('idle');
  const [profileUploadProgress, setProfileUploadProgress] = useState(0);
  const [profileUploadStage, setProfileUploadStage] = useState<'idle' | 'processing' | 'uploading'>(
    'idle',
  );
  const profileUploadAbortController = useRef<AbortController | null>(null);
  const profileUploadCancelled = useRef(false);

  const refresh = () => invalidateBusinessCaches(queryClient, businessId);
  const profileMutation = useMutation({
    mutationFn: (payload: BusinessProfileUpdate) =>
      businessEditorApi.updateProfile(businessId, payload),
    onSuccess: refresh,
  });
  const contactMutation = useMutation({
    mutationFn: (payload: BusinessContactUpdate) =>
      businessEditorApi.updateContact(businessId, payload),
    onSuccess: refresh,
  });
  const profilePhotoMutation = useMutation({
    mutationFn: async (photo: ImagePicker.ImagePickerAsset) => {
      const prepared = await prepareImageForUpload(photo, 'avatar');
      setProfileUploadStage('uploading');
      const controller = new AbortController();
      profileUploadAbortController.current = controller;
      try {
        return await businessEditorApi.uploadProfilePhoto(businessId, prepared, {
          onProgress: setProfileUploadProgress,
          signal: controller.signal,
        });
      } finally {
        if (profileUploadAbortController.current === controller) {
          profileUploadAbortController.current = null;
        }
        cleanupPreparedImage(prepared);
      }
    },
    onSuccess: refresh,
    onSettled: () => setProfileUploadStage('idle'),
  });

  async function pickProfilePhoto() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão necessária',
        'Permita o acesso às fotos para escolher uma imagem de perfil.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      mediaTypes: ['images'],
      quality: 1,
    });
    if (result.canceled) return;

    setProfileUploadProgress(0);
    profileUploadCancelled.current = false;
    setProfileUploadStage('processing');
    profilePhotoMutation.mutate(result.assets[0], {
      onError: (error) => {
        if (profileUploadCancelled.current) return;
        Alert.alert(
          'Não foi possível enviar a foto',
          error instanceof Error ? error.message : 'Tente novamente.',
        );
      },
    });
  }

  function cancelProfilePhotoUpload() {
    profileUploadCancelled.current = true;
    profileUploadAbortController.current?.abort();
  }

  function saveDescription() {
    profileMutation.mutate(profile, {
      onSuccess: () => setDescriptionStatus('saved'),
      onError: () => Alert.alert('Não foi possível salvar', 'Tente novamente.'),
    });
  }
  function saveContact() {
    contactMutation.mutate(contact, {
      onSuccess: () => setContactStatus('saved'),
      onError: () => Alert.alert('Não foi possível salvar', 'Tente novamente.'),
    });
  }
  function saveFacilities() {
    profileMutation.mutate(profile, {
      onSuccess: () => setFacilitiesStatus('saved'),
      onError: () => Alert.alert('Não foi possível salvar', 'Tente novamente.'),
    });
  }

  const images = (data.profile.media?.map((item) => item.url) ?? [data.profile.avatar_url]).filter(
    (url): url is string => Boolean(url),
  );
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Voltar" onPress={onBack}>
            <Ionicons color={colors.foreground} name="arrow-back" size={25} />
          </Pressable>
          <Text style={styles.title}>Meu negócio</Text>
        </View>
        <View style={styles.profileSection}>
          <View style={styles.profileRow}>
            <View>
              {data.profile.avatar_url ? (
                <Image source={{ uri: data.profile.avatar_url }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.imageEmpty]}>
                  <Ionicons color={colors.mutedForeground} name="storefront-outline" size={28} />
                </View>
              )}
              {profileUploadStage !== 'idle' ? (
                <View style={styles.photoUploadOverlay}>
                  <ActivityIndicator color={colors.primary} size="small" />
                  <Text style={styles.photoUploadProgress}>
                    {profileUploadStage === 'processing'
                      ? 'Otimizando…'
                      : `${profileUploadProgress}%`}
                  </Text>
                  {profileUploadStage === 'uploading' ? (
                    <Pressable onPress={cancelProfilePhotoUpload} style={styles.cancelPhotoUpload}>
                      <Text style={styles.cancelPhotoUploadText}>Cancelar</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
              <Pressable
                accessibilityLabel="Editar foto de perfil"
                disabled={profileUploadStage !== 'idle'}
                onPress={pickProfilePhoto}
                style={[styles.photoEdit, profileUploadStage !== 'idle' && styles.disabled]}
              >
                <Ionicons color={colors.primaryForeground} name="pencil" size={14} />
              </Pressable>
            </View>
            <View style={styles.profileInfo}>
              <Text numberOfLines={1} style={styles.businessName}>
                {profile.commercial_name || data.profile.name}
              </Text>
              <View style={styles.profileTags}>
                {visibleProfileTags.map((tag) => (
                  <View key={tag.id} style={styles.profileTag}>
                    <Text numberOfLines={1} style={styles.profileTagText}>
                      {tag.name}
                    </Text>
                  </View>
                ))}
                {hiddenProfileTags > 0 ? (
                  <View style={styles.profileTagCount}>
                    <Text style={styles.profileTagCountText}>(+{hiddenProfileTags})</Text>
                  </View>
                ) : null}
                <Pressable
                  onPress={() => router.push('/(app)/businesses/tags')}
                  style={styles.editPill}
                >
                  <Ionicons color={colors.background} name="pencil" size={14} />
                  <Text style={styles.editPillText}>Editar tags</Text>
                </Pressable>
              </View>
            </View>
          </View>
          <View style={styles.divider} />
          <Text style={styles.description}>
            {profile.description || 'Conte a história do seu negócio.'}
          </Text>
          <Pressable onPress={() => setEditor('description')} style={styles.editPill}>
            <Ionicons color={colors.background} name="pencil" size={14} />
            <Text style={styles.editPillText}>Editar descrição</Text>
          </Pressable>
        </View>

        <View style={styles.gallerySection}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            style={styles.imageFrame}
          >
            {images.length ? (
              images.map((uri) => <Image key={uri} source={{ uri }} style={styles.image} />)
            ) : (
              <View style={[styles.image, styles.imageEmpty]}>
                <Ionicons color={colors.mutedForeground} name="image-outline" size={42} />
                <Text style={styles.muted}>Sem imagens públicas</Text>
              </View>
            )}
          </ScrollView>
          <Pressable
            onPress={() => router.push('/(app)/businesses/gallery')}
            style={styles.galleryEdit}
          >
            <Ionicons color={colors.background} name="pencil" size={14} />
            <Text style={styles.editPillText}>Editar galeria de fotos</Text>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.actionCards}
        >
          <ActionCard
            icon="people-outline"
            label="Contatos e Redes sociais"
            onPress={() => setEditor('contact')}
          />
          <ActionCard
            icon="time-outline"
            label="Horário de funcionamento"
            onPress={() =>
              Alert.alert('Horários', 'A edição de horários depende de suporte da API.')
            }
          />
          <ActionCard
            icon="location-outline"
            label="Localização"
            onPress={() =>
              Alert.alert('Localização', 'A edição de localização depende de suporte da API.')
            }
          />
        </ScrollView>

        <Section title="Facilidades">
          <View style={styles.chips}>
            {facilities.map(([key, label]) =>
              profile[key] ? (
                <Chip
                  key={key}
                  label={label}
                  onPress={() => {
                    setProfile({ ...profile, [key]: false });
                    setFacilitiesStatus('dirty');
                  }}
                />
              ) : null,
            )}
            {facilities.some(([key]) => !profile[key]) && (
              <AddChip onPress={() => setEditor('facilities')} />
            )}
          </View>
          <FadeSaveButton
            status={facilitiesStatus}
            loading={profileMutation.isPending}
            onPress={saveFacilities}
            onSavedMessageExpired={() => setFacilitiesStatus('idle')}
          />
        </Section>
        <Pressable
          onPress={() => router.push(`/(app)/businesses/${businessId}`)}
          style={styles.previewButton}
        >
          <Ionicons color={colors.primaryForeground} name="eye-outline" size={20} />
          <Text style={styles.previewButtonText}>Visualizar página pública</Text>
        </Pressable>
      </ScrollView>
      <EditorModal
        title={
          editor === 'contact'
            ? 'Contatos e redes sociais'
            : editor === 'facilities'
              ? 'Facilidades'
              : editor === 'description'
                ? 'Editar descrição'
                : 'Editar perfil'
        }
        visible={editor !== null}
        onClose={() => setEditor(null)}
      >
        {editor === 'profile' && (
          <TextField
            value={profile.commercial_name ?? ''}
            onChangeText={(commercial_name) => {
              setProfile({ ...profile, commercial_name });
              setDescriptionStatus('dirty');
            }}
            placeholder="Nome comercial"
          />
        )}
        {editor === 'description' && (
          <TextField
            value={profile.description ?? ''}
            onChangeText={(description) => {
              setProfile({ ...profile, description });
              setDescriptionStatus('dirty');
            }}
            placeholder="Conte a história do seu negócio"
          />
        )}
        {editor === 'contact' && (
          <>
            <TextField
              value={contact.instagram ?? ''}
              onChangeText={(instagram) => {
                setContact({ ...contact, instagram });
                setContactStatus('dirty');
              }}
              placeholder="instagram.com/"
            />
            <TextField
              value={contact.whatsapp ?? ''}
              onChangeText={(whatsapp) => {
                setContact({ ...contact, whatsapp });
                setContactStatus('dirty');
              }}
              placeholder="WhatsApp"
              keyboardType="phone-pad"
            />
            <TextField
              value={contact.public_email ?? ''}
              onChangeText={(public_email) => {
                setContact({ ...contact, public_email });
                setContactStatus('dirty');
              }}
              placeholder="E-mail público"
              keyboardType="email-address"
            />
            <TextField
              value={contact.website ?? ''}
              onChangeText={(website) => {
                setContact({ ...contact, website });
                setContactStatus('dirty');
              }}
              placeholder="Site"
              autoCapitalize="none"
            />
          </>
        )}
        {editor === 'facilities' && (
          <View style={styles.chips}>
            {facilities.map(([key, label]) => (
              <Pressable
                key={key}
                onPress={() => {
                  setProfile({ ...profile, [key]: !profile[key] });
                  setFacilitiesStatus('dirty');
                }}
                style={[styles.chip, profile[key] && styles.selectedChip]}
              >
                <Text style={styles.chipText}>{label}</Text>
              </Pressable>
            ))}
          </View>
        )}
        {editor === 'contact' ? (
          <FadeSaveButton
            loading={contactMutation.isPending}
            onPress={saveContact}
            onSavedMessageExpired={() => setContactStatus('idle')}
            status={contactStatus}
          />
        ) : editor === 'facilities' ? (
          <FadeSaveButton
            loading={profileMutation.isPending}
            onPress={saveFacilities}
            onSavedMessageExpired={() => setFacilitiesStatus('idle')}
            status={facilitiesStatus}
          />
        ) : (
          <FadeSaveButton
            loading={profileMutation.isPending}
            onPress={saveDescription}
            onSavedMessageExpired={() => setDescriptionStatus('idle')}
            status={descriptionStatus}
          />
        )}
      </EditorModal>
    </View>
  );
}

function ActionCard({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={styles.actionCard}>
      <Ionicons color={colors.mutedForeground} name={icon} size={24} />
      <View style={styles.actionEdit}>
        <Ionicons color={colors.background} name="pencil" size={14} />
      </View>
      <Text style={styles.actionCardText}>{label}</Text>
    </Pressable>
  );
}

function EditorModal({
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
      <View style={styles.modalHeader}>
        <Text style={styles.title}>{title}</Text>
        <Pressable accessibilityLabel="Fechar" onPress={onClose}>
          <Ionicons color={colors.foreground} name="close" size={24} />
        </Pressable>
      </View>
      <ScrollView contentContainerStyle={styles.editorContent}>{children}</ScrollView>
    </BottomSheet>
  );
}

function Section({
  children,
  subtitle,
  title,
  trailing,
}: {
  children: React.ReactNode;
  subtitle?: string;
  title: string;
  trailing?: string;
}) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeading}>
        <View>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>
        {trailing && <Text style={styles.edit}>{trailing}</Text>}
      </View>
      {children}
    </View>
  );
}
function TextField(props: React.ComponentProps<typeof TextInput>) {
  return (
    <TextInput
      placeholderTextColor={colors.mutedForeground}
      style={[styles.input, props.style]}
      {...props}
    />
  );
}
function Chip({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.chip}>
      <Text style={styles.chipText}>{label}</Text>
      <Ionicons color={colors.mutedForeground} name="close" size={16} />
    </Pressable>
  );
}
function AddChip({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.addChip}>
      <Text style={styles.addChipText}>Adicionar</Text>
      <Ionicons color={colors.background} name="add" size={17} />
    </Pressable>
  );
}
function FadeSaveButton({
  loading,
  onPress,
  onSavedMessageExpired,
  status,
}: {
  loading: boolean;
  onPress: () => void;
  onSavedMessageExpired: () => void;
  status: SaveStatus;
}) {
  const visible = status !== 'idle';
  const [progress] = useState(() => new Animated.Value(visible ? 1 : 0));

  useEffect(() => {
    Animated.timing(progress, {
      duration: visible ? 180 : 150,
      toValue: visible ? 1 : 0,
      useNativeDriver: false,
    }).start();
  }, [progress, visible]);

  useEffect(() => {
    if (status !== 'saved') return;
    const timeout = setTimeout(onSavedMessageExpired, 3000);
    return () => clearTimeout(timeout);
  }, [onSavedMessageExpired, status]);

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={{
        height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, 48] }),
        opacity: progress,
        overflow: 'hidden',
      }}
    >
      {status === 'saved' ? (
        <View style={styles.savedGroup}>
          <Ionicons color={colors.primary} name="checkmark-circle" size={18} />
          <Text style={styles.savedGroupText}>Alterações salvas</Text>
        </View>
      ) : (
        <Pressable
          disabled={loading}
          onPress={onPress}
          style={[styles.saveGroup, loading && styles.disabled]}
        >
          <Text style={styles.saveGroupText}>{loading ? 'Salvando…' : 'Salvar alterações'}</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}
function ScreenState({
  icon,
  onRetry,
  text,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  onRetry?: () => void;
  text: string;
}) {
  return (
    <View style={styles.state}>
      <Ionicons color={colors.mutedForeground} name={icon} size={48} />
      <Text style={styles.muted}>{text}</Text>
      {onRetry && (
        <Pressable onPress={onRetry}>
          <Text style={styles.edit}>Tentar novamente</Text>
        </Pressable>
      )}
    </View>
  );
}

function MyBusinessSkeleton() {
  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Skeleton style={styles.skeletonBack} />
          <Skeleton style={styles.skeletonTitle} />
        </View>
        <View style={styles.skeletonProfileSection}>
          <View style={styles.profileRow}>
            <Skeleton style={styles.skeletonAvatar} />
            <View style={styles.skeletonProfileInfo}>
              <Skeleton style={styles.skeletonBusinessName} />
              <View style={styles.skeletonChips}>
                <Skeleton style={styles.skeletonTag} />
                <Skeleton style={styles.skeletonTagWide} />
                <Skeleton style={styles.skeletonEditPill} />
              </View>
            </View>
          </View>
          <Skeleton style={styles.skeletonDivider} />
          <Skeleton style={styles.skeletonDescription} />
          <Skeleton style={styles.skeletonEditPill} />
        </View>
        <Skeleton style={styles.skeletonGallery} />
        <View style={styles.skeletonActionCards}>
          <Skeleton style={styles.skeletonActionCard} />
          <Skeleton style={styles.skeletonActionCard} />
          <Skeleton style={styles.skeletonActionCard} />
        </View>
        <View style={styles.section}>
          <Skeleton style={styles.skeletonHeading} />
          <View style={styles.skeletonChips}>
            <Skeleton style={styles.skeletonTag} />
            <Skeleton style={styles.skeletonTagWide} />
            <Skeleton style={styles.skeletonTag} />
          </View>
        </View>
        <Skeleton style={styles.skeletonButton} />
      </ScrollView>
    </View>
  );
}

function Skeleton({ style }: { style: StyleProp<ViewStyle> }) {
  return <View style={[styles.skeleton, style]} />;
}

const styles = {
  screen: { backgroundColor: colors.background, flex: 1 },
  content: { gap: 32, paddingBottom: 112, paddingHorizontal: 16, paddingTop: 52 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 12 },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  profileSection: { gap: 10 },
  profileRow: { alignItems: 'flex-start' as const, flexDirection: 'row' as const, gap: 10 },
  avatar: {
    borderColor: colors.border,
    borderRadius: 999,
    borderWidth: 1,
    height: 64,
    overflow: 'hidden' as const,
    width: 64,
  },
  profileInfo: { flex: 1, gap: 6 },
  businessName: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 16 },
  profileTags: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 4 },
  profileTag: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  profileTagText: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 12,
    maxWidth: 88,
  },
  profileTagCount: { paddingHorizontal: 2, paddingVertical: 6 },
  profileTagCountText: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  photoEdit: {
    alignItems: 'center' as const,
    backgroundColor: colors.foreground,
    borderRadius: 16,
    height: 24,
    justifyContent: 'center' as const,
    left: 43,
    position: 'absolute' as const,
    top: -3,
    width: 24,
  },
  photoUploadOverlay: {
    alignItems: 'center' as const,
    backgroundColor: 'rgba(10,10,10,0.68)',
    borderRadius: 999,
    height: 64,
    justifyContent: 'center' as const,
    left: 0,
    overflow: 'hidden' as const,
    position: 'absolute' as const,
    top: 0,
    width: 64,
  },
  photoUploadProgress: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 10 },
  cancelPhotoUpload: { paddingHorizontal: 4, paddingVertical: 2 },
  cancelPhotoUploadText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 10 },
  divider: { backgroundColor: '#27272A', borderRadius: 2, height: 2, marginTop: 10, width: '100%' },
  description: {
    color: colors.foreground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 19,
  },
  editPill: {
    alignItems: 'center' as const,
    alignSelf: 'flex-start' as const,
    backgroundColor: colors.foreground,
    borderRadius: 32,
    flexDirection: 'row' as const,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  editPillText: { color: colors.background, fontFamily: 'DMSans-Medium', fontSize: 12 },
  gallerySection: { height: 256, position: 'relative' as const },
  section: { gap: 12 },
  sectionHeading: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  subtitle: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14, marginTop: 4 },
  edit: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  imageFrame: { borderRadius: 12, height: 256 },
  image: { borderRadius: 12, height: 256, width: 361 },
  imageEmpty: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    gap: 8,
    justifyContent: 'center' as const,
  },
  muted: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  galleryEdit: {
    alignItems: 'center' as const,
    backgroundColor: colors.foreground,
    borderRadius: 32,
    flexDirection: 'row' as const,
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    position: 'absolute' as const,
    right: 16,
    top: 12,
  },
  actionCards: { gap: 12, paddingRight: 16 },
  actionCard: {
    backgroundColor: '#27272A',
    borderRadius: 8,
    height: 92,
    justifyContent: 'center' as const,
    overflow: 'hidden' as const,
    paddingHorizontal: 12,
    paddingVertical: 8,
    position: 'relative' as const,
    width: 128,
  },
  actionCardText: {
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    lineHeight: 18,
    marginTop: 2,
  },
  actionEdit: {
    alignItems: 'center' as const,
    backgroundColor: colors.foreground,
    borderRadius: 20,
    height: 24,
    justifyContent: 'center' as const,
    position: 'absolute' as const,
    right: 8,
    top: 7,
    width: 32,
  },
  skeleton: { backgroundColor: '#27272A', borderRadius: 8 },
  skeletonBack: { borderRadius: 16, height: 26, width: 26 },
  skeletonTitle: { height: 20, width: 132 },
  skeletonProfileSection: { gap: 10 },
  skeletonAvatar: { borderRadius: 32, height: 64, width: 64 },
  skeletonProfileInfo: { flex: 1, gap: 10 },
  skeletonBusinessName: { height: 18, width: 136 },
  skeletonDivider: { height: 2, marginTop: 10, width: '100%' },
  skeletonDescription: { height: 56, width: '100%' },
  skeletonEditPill: { borderRadius: 20, height: 32, width: 118 },
  skeletonGallery: { borderRadius: 12, height: 256, width: '100%' },
  skeletonActionCards: { flexDirection: 'row' as const, gap: 12 },
  skeletonActionCard: { borderRadius: 8, height: 92, width: 128 },
  skeletonHeading: { height: 18, marginTop: 4, width: 112 },
  skeletonChips: { flexDirection: 'row' as const, gap: 8 },
  skeletonTag: { borderRadius: 24, height: 28, width: 78 },
  skeletonTagWide: { borderRadius: 24, height: 28, width: 112 },
  skeletonButton: { borderRadius: 24, height: 48, marginTop: 8, width: '100%' },
  chips: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 8 },
  chip: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 32,
    borderWidth: 1,
    flexDirection: 'row' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chipText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  addChip: {
    alignItems: 'center' as const,
    backgroundColor: colors.foreground,
    borderRadius: 32,
    flexDirection: 'row' as const,
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  addChipText: { color: colors.background, fontFamily: 'DMSans-Medium', fontSize: 14 },
  input: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 12,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: 'DMSans-Regular',
    fontSize: 16,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  selectedChip: { backgroundColor: 'rgba(159,255,139,0.1)', borderColor: colors.primary },
  modalHeader: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  editorContent: { gap: 12, paddingBottom: 12, paddingTop: 8 },
  tagHint: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    marginTop: 8,
  },
  tagList: { paddingBottom: 16, paddingTop: 8 },
  tagRow: {
    alignItems: 'center' as const,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    minHeight: 52,
  },
  save: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center' as const,
  },
  saveText: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 15 },
  saveGroup: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 44,
    justifyContent: 'center' as const,
    marginTop: 4,
  },
  saveGroupText: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  savedGroup: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 8,
    height: 44,
    justifyContent: 'center' as const,
    marginTop: 4,
  },
  savedGroupText: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 14 },
  disabled: { opacity: 0.55 },
  state: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    flex: 1,
    gap: 12,
    justifyContent: 'center' as const,
    padding: 24,
  },
  previewButton: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    flexDirection: 'row' as const,
    gap: 8,
    height: 48,
    justifyContent: 'center' as const,
    marginTop: 8,
  },
  previewButtonText: {
    color: colors.primaryForeground,
    fontFamily: 'DMSans-SemiBold',
    fontSize: 15,
  },
} as const;
