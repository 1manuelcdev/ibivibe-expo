import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, Text, TextInput, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import type { Review } from '@/features/reviews/reviews-api';
import { colors } from '@/theme/tokens';

const MAX_COMMENT_LENGTH = 300;

export function ReviewInputSheet({
  initialReview,
  isSaving,
  onClose,
  onSubmit,
}: {
  initialReview?: Review;
  isSaving: boolean;
  onClose: () => void;
  onSubmit: (input: { comment: string; rating: number }) => Promise<void>;
}) {
  const [comment, setComment] = useState(initialReview?.comment ?? '');
  const [rating, setRating] = useState(initialReview?.rating ?? 0);
  const editing = Boolean(initialReview);

  async function submit() {
    if (!rating || isSaving) return;
    try {
      await onSubmit({ comment: comment.trim(), rating });
      onClose();
    } catch {
      Alert.alert('Não foi possível salvar sua avaliação', 'Tente novamente em alguns instantes.');
    }
  }

  return (
    <BottomSheet onClose={onClose} visible>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{editing ? 'Editar avaliação' : 'Avaliar'}</Text>
          <Text style={styles.subtitle}>
            Conte-nos sobre sua experiência e ajude outras pessoas
          </Text>
        </View>
        <View style={styles.ratingInput}>
          <Text style={styles.ratingValue}>{rating.toFixed(1)}</Text>
          <View style={styles.stars}>
            {[1, 2, 3, 4, 5].map((value) => (
              <Pressable
                accessibilityLabel={`${value} estrela${value > 1 ? 's' : ''}`}
                accessibilityRole="radio"
                accessibilityState={{ selected: rating === value }}
                hitSlop={6}
                key={value}
                onPress={() => setRating(value)}
              >
                <Ionicons
                  color={value <= rating ? colors.primary : '#71717A'}
                  name="star"
                  size={34}
                />
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.commentField}>
          <TextInput
            maxLength={MAX_COMMENT_LENGTH}
            multiline
            onChangeText={setComment}
            placeholder="Sua opinião importa! Compartilhe seu ponto de vista"
            placeholderTextColor={colors.mutedForeground}
            style={styles.commentInput}
            textAlignVertical="top"
            value={comment}
          />
          <Text style={styles.counter}>
            {comment.length}/{MAX_COMMENT_LENGTH}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          disabled={!rating || isSaving}
          onPress={() => void submit()}
          style={[styles.submit, (!rating || isSaving) && styles.disabled]}
        >
          <Text style={styles.submitText}>
            {isSaving ? 'Salvando...' : editing ? 'Salvar alterações' : 'Enviar avaliação'}
          </Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = {
  content: { gap: 24, paddingBottom: 8, paddingHorizontal: 8 },
  header: { alignItems: 'center' as const, gap: 10 },
  title: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 20 },
  subtitle: {
    color: colors.mutedForeground,
    fontFamily: 'DMSans-Regular',
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 279,
    textAlign: 'center' as const,
  },
  ratingInput: { alignItems: 'center' as const, gap: 12 },
  ratingValue: { color: colors.foreground, fontFamily: 'DMSans-SemiBold', fontSize: 28 },
  stars: { flexDirection: 'row' as const, gap: 10 },
  commentField: { alignItems: 'flex-end' as const, gap: 8 },
  commentInput: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    color: colors.foreground,
    fontFamily: 'DMSans-Medium',
    fontSize: 14,
    height: 132,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: '100%' as const,
  },
  counter: { color: colors.primary, fontFamily: 'DMSans-Regular', fontSize: 14 },
  submit: {
    alignItems: 'center' as const,
    backgroundColor: colors.primary,
    borderRadius: 24,
    height: 48,
    justifyContent: 'center' as const,
  },
  submitText: { color: colors.primaryForeground, fontFamily: 'DMSans-SemiBold', fontSize: 14 },
  disabled: { opacity: 0.45 },
} as const;
