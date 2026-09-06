import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
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
import type { OnboardingTag } from '@/features/onboarding/models/onboarding-types';
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
    <BusinessEditor key={query.data.business.id} data={query.data} onBack={() => router.back()} />
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
    bio: data.profile.bio ?? '',
    commercial_name: data.profile.commercial_name ?? data.profile.name ?? '',
    description: data.profile.description ?? '',
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
  const [selectedTags, setSelectedTags] = useState(() =>
    data.tags.filter((tag) => data.profile.tags?.includes(tag.name)).slice(0, 4),
  );
  const [pickerVisible, setPickerVisible] = useState(false);
  const [descriptionStatus, setDescriptionStatus] = useState<SaveStatus>('idle');
  const [contactStatus, setContactStatus] = useState<SaveStatus>('idle');
  const [tagsStatus, setTagsStatus] = useState<SaveStatus>('idle');
  const [facilitiesStatus, setFacilitiesStatus] = useState<SaveStatus>('idle');

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['business-editor'] });
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
  const tagsMutation = useMutation({
    mutationFn: (tags: OnboardingTag[]) =>
      businessEditorApi.updateTags(
        businessId,
        tags.map((tag) => tag.id),
      ),
    onSuccess: refresh,
  });

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
  function saveTags() {
    tagsMutation.mutate(selectedTags, {
      onSuccess: () => setTagsStatus('saved'),
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
          <Text style={styles.title}>Meu Negócio</Text>
        </View>
        <Section title="Imagens" trailing="Visualizar">
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
        </Section>
        <Section title="Tags" subtitle="Adicione até 4 (plano básico)">
          <View style={styles.chips}>
            {selectedTags.map((tag) => (
              <Chip
                key={tag.id}
                label={tag.name}
                onPress={() => {
                  setSelectedTags(selectedTags.filter((item) => item.id !== tag.id));
                  setTagsStatus('dirty');
                }}
              />
            ))}
            {selectedTags.length < 4 && <AddChip onPress={() => setPickerVisible(true)} />}
          </View>
          <FadeSaveButton
            status={tagsStatus}
            loading={tagsMutation.isPending}
            onPress={saveTags}
            onSavedMessageExpired={() => setTagsStatus('idle')}
          />
        </Section>
        <Section title="Descrição">
          <TextField
            value={profile.commercial_name ?? ''}
            onChangeText={(commercial_name) => {
              setProfile({ ...profile, commercial_name });
              setDescriptionStatus('dirty');
            }}
            placeholder="Nome comercial"
          />
          <TextField
            value={profile.bio ?? ''}
            onChangeText={(bio) => {
              setProfile({ ...profile, bio });
              setDescriptionStatus('dirty');
            }}
            placeholder="Resumo do negócio"
          />
          <TextField
            value={profile.description ?? ''}
            onChangeText={(description) => {
              setProfile({ ...profile, description });
              setDescriptionStatus('dirty');
            }}
            placeholder="Conte a história do seu negócio"
          />
          <FadeSaveButton
            status={descriptionStatus}
            loading={profileMutation.isPending}
            onPress={saveDescription}
            onSavedMessageExpired={() => setDescriptionStatus('idle')}
          />
        </Section>
        <Section title="Contatos / Redes Sociais" subtitle="Adicione até 2 (plano básico)">
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
          <FadeSaveButton
            status={contactStatus}
            loading={contactMutation.isPending}
            onPress={saveContact}
            onSavedMessageExpired={() => setContactStatus('idle')}
          />
        </Section>
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
              <AddChip
                onPress={() => {
                  const next = facilities.find(([key]) => !profile[key]);
                  if (next) {
                    setProfile({ ...profile, [next[0]]: true });
                    setFacilitiesStatus('dirty');
                  }
                }}
              />
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
      <TagPicker
        selected={selectedTags}
        tags={data.tags}
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onSave={(next) => {
          setSelectedTags(next);
          setTagsStatus('dirty');
          setPickerVisible(false);
        }}
      />
    </View>
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
function TagPicker({
  onClose,
  onSave,
  selected,
  tags,
  visible,
}: {
  onClose: () => void;
  onSave: (tags: OnboardingTag[]) => void;
  selected: OnboardingTag[];
  tags: OnboardingTag[];
  visible: boolean;
}) {
  const [draft, setDraft] = useState(selected);
  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.title}>Adicionar tags</Text>
            <Pressable onPress={onClose}>
              <Ionicons color={colors.foreground} name="close" size={24} />
            </Pressable>
          </View>
          <ScrollView>
            {tags.map((tag) => {
              const selectedTag = draft.some((item) => item.id === tag.id);
              return (
                <Pressable
                  key={tag.id}
                  onPress={() =>
                    setDraft(
                      selectedTag
                        ? draft.filter((item) => item.id !== tag.id)
                        : draft.length < 4
                          ? [...draft, tag]
                          : draft,
                    )
                  }
                  style={styles.tagRow}
                >
                  <Text style={styles.chipText}>{tag.name}</Text>
                  {selectedTag && <Ionicons color={colors.primary} name="checkmark" size={20} />}
                </Pressable>
              );
            })}
          </ScrollView>
          <Pressable onPress={() => onSave(draft)} style={styles.save}>
            <Text style={styles.saveText}>Salvar tags</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
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
        <Skeleton style={styles.skeletonImage} />

        <View style={styles.section}>
          <Skeleton style={styles.skeletonHeading} />
          <View style={styles.skeletonChips}>
            <Skeleton style={styles.skeletonChip} />
            <Skeleton style={styles.skeletonChipWide} />
            <Skeleton style={styles.skeletonChip} />
          </View>
        </View>

        <View style={styles.section}>
          <Skeleton style={styles.skeletonHeading} />
          <Skeleton style={styles.skeletonInput} />
          <Skeleton style={styles.skeletonInput} />
          <Skeleton style={styles.skeletonInput} />
        </View>

        <View style={styles.section}>
          <Skeleton style={styles.skeletonHeading} />
          <Skeleton style={styles.skeletonInput} />
          <Skeleton style={styles.skeletonInput} />
          <Skeleton style={styles.skeletonInput} />
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
  content: { gap: 24, padding: 24, paddingBottom: 40, paddingTop: 52 },
  header: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 12 },
  title: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 18 },
  section: { gap: 12 },
  sectionHeading: {
    alignItems: 'flex-start' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  sectionTitle: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 16 },
  subtitle: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 14, marginTop: 4 },
  edit: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 14 },
  imageFrame: { borderRadius: 16, height: 213 },
  image: { borderRadius: 16, height: 213, width: 345 },
  imageEmpty: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    gap: 8,
    justifyContent: 'center' as const,
  },
  muted: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  skeleton: { backgroundColor: '#27272A', borderRadius: 8 },
  skeletonBack: { borderRadius: 16, height: 26, width: 26 },
  skeletonTitle: { height: 20, width: 132 },
  skeletonImage: { borderRadius: 16, height: 213, width: '100%' },
  skeletonHeading: { height: 18, marginTop: 4, width: 112 },
  skeletonChips: { flexDirection: 'row' as const, gap: 8 },
  skeletonChip: { borderRadius: 24, height: 36, width: 86 },
  skeletonChipWide: { borderRadius: 24, height: 36, width: 126 },
  skeletonInput: { height: 40, width: '100%' },
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
  modalBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.65)',
    flex: 1,
    justifyContent: 'flex-end' as const,
  },
  modal: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    gap: 16,
    maxHeight: '75%' as const,
    padding: 24,
  },
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
