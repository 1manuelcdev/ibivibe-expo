import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { ReviewInputSheet } from '@/features/reviews/components/ReviewInputSheet';
import { reviewsApi } from '@/features/reviews/reviews-api';
import { useSessionStore } from '@/stores/session-store';
import { colors } from '@/theme/tokens';

export function ReviewSection({
  entityId,
  kind,
}: {
  entityId: string;
  kind: 'business' | 'event';
}) {
  const account = useSessionStore((state) => state.account);
  const accountId = account?.id;
  const queryClient = useQueryClient();
  const [sheetVisible, setSheetVisible] = useState(false);
  const reviews = useQuery({
    queryFn: () => reviewsApi.list(kind, entityId),
    queryKey: ['reviews', kind, entityId],
  });
  const currentReview = reviews.data?.find((review) => review.account_id === accountId);
  const saveReview = useMutation({
    mutationFn: async ({ comment, rating }: { comment: string; rating: number }) => {
      if (!accountId) throw new Error('Missing account');
      if (currentReview) return reviewsApi.update(currentReview.id, { comment, rating });
      return reviewsApi.create({
        ...(kind === 'business' ? { business_id: entityId } : { event_id: entityId }),
        comment,
        rating,
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['reviews', kind, entityId] }),
  });
  const average = reviews.data?.length
    ? reviews.data.reduce((total, review) => total + review.rating, 0) / reviews.data.length
    : 0;

  return (
    <View style={styles.section}>
      <Text style={styles.title}>Avaliações</Text>
      <View style={styles.summary}>
        <View style={styles.ratingRow}>
          <Text style={styles.rating}>{average.toFixed(1)}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Ionicons
                color={value <= Math.round(average) ? '#86EFAC' : '#71717A'}
                key={value}
                name="star"
                size={19}
              />
            ))}
          </View>
        </View>
        <Pressable
          disabled={!accountId}
          onPress={() => setSheetVisible(true)}
          style={[styles.rateButton, !accountId && styles.disabled]}
        >
          <Text style={styles.rateButtonText}>{currentReview ? 'Editar' : 'Avaliar'}</Text>
        </Pressable>
      </View>
      <Text style={styles.count}>
        {reviews.isLoading
          ? 'Carregando avaliações...'
          : reviews.data?.length === 1
            ? '1 avaliação'
            : `${reviews.data?.length ?? 0} avaliações`}
      </Text>
      {reviews.data?.map((review) => {
        const isCurrent = review.account_id === accountId;
        const name = review.account?.display_name ?? (isCurrent ? 'Você' : 'Visitante');
        return (
          <Pressable
            disabled={!isCurrent}
            key={review.id}
            onPress={() => setSheetVisible(true)}
            style={[styles.review, isCurrent && styles.currentReview]}
          >
            <View style={styles.reviewHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{name.slice(0, 1).toUpperCase()}</Text>
              </View>
              <Text style={styles.reviewName}>{isCurrent ? 'Sua avaliação' : name}</Text>
              <View style={styles.reviewRating}>
                <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
                <Ionicons color="#86EFAC" name="star" size={11} />
              </View>
            </View>
            {review.comment ? <Text style={styles.comment}>{review.comment}</Text> : null}
            {isCurrent ? <Text style={styles.editHint}>Toque para editar</Text> : null}
          </Pressable>
        );
      })}
      {sheetVisible ? (
        <ReviewInputSheet
          initialReview={currentReview}
          isSaving={saveReview.isPending}
          onClose={() => setSheetVisible(false)}
          onSubmit={async (input) => {
            await saveReview.mutateAsync(input);
          }}
        />
      ) : null}
    </View>
  );
}

const styles = {
  section: { gap: 10, marginTop: 6 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 18 },
  summary: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
  },
  ratingRow: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 10 },
  rating: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 24 },
  stars: { flexDirection: 'row' as const, gap: 2 },
  rateButton: {
    borderColor: '#4D4D56',
    borderRadius: 24,
    borderWidth: 1.6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  rateButtonText: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 14 },
  count: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 12 },
  review: { backgroundColor: '#27272A', borderRadius: 8, gap: 6, padding: 12 },
  currentReview: { borderColor: colors.primary, borderWidth: 1 },
  reviewHeader: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 6 },
  avatar: {
    alignItems: 'center' as const,
    backgroundColor: colors.background,
    borderRadius: 10,
    height: 20,
    justifyContent: 'center' as const,
    width: 20,
  },
  avatarText: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 10 },
  reviewName: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  reviewRating: { alignItems: 'center' as const, flexDirection: 'row' as const, gap: 4 },
  reviewRatingText: { color: colors.foreground, fontFamily: 'DMSans-Medium', fontSize: 12 },
  comment: { color: colors.foreground, fontFamily: 'DMSans-Regular', fontSize: 12, lineHeight: 17 },
  editHint: { color: colors.primary, fontFamily: 'DMSans-Medium', fontSize: 12 },
  disabled: { opacity: 0.45 },
} as const;
