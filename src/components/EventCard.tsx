import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Image, Pressable, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors } from '@/theme/tokens';
import { normalizeImageUrl } from '@/utils/normalize-image-url';

export function EventCard({
  date,
  fullWidth = false,
  image,
  onPress,
  style,
  tags,
  title,
}: {
  date: string;
  fullWidth?: boolean;
  image?: string | null;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tags: string[];
  title: string;
}) {
  const [imageError, setImageError] = useState(false);
  const imageUri = normalizeImageUrl(image);

  return (
    <Pressable onPress={onPress} style={[styles.card, fullWidth && styles.fullWidth, style]}>
      {imageUri && !imageError ? (
        <Image
          onError={() => setImageError(true)}
          resizeMode="cover"
          source={{ uri: imageUri }}
          style={styles.image}
        />
      ) : (
        <View style={[styles.image, styles.imagePlaceholder]}>
          <Ionicons color={colors.mutedForeground} name="calendar-outline" size={26} />
        </View>
      )}
      <View style={styles.text}>
        <View style={styles.titleBlock}>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.badges}>
          {tags.slice(0, 2).map((tag) => (
            <View key={tag} style={styles.badge}>
              <Text style={styles.badgeLabel}>{tag}</Text>
            </View>
          ))}
        </View>
      </View>
    </Pressable>
  );
}

const styles = {
  card: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 12,
    minWidth: 218,
    width: 218,
  },
  fullWidth: { flex: 1, minWidth: 0, width: 'auto' as const },
  image: { backgroundColor: '#27272A', borderRadius: 8, height: 80, width: 80 },
  imagePlaceholder: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  text: { flex: 1, gap: 8, minWidth: 0 },
  titleBlock: { gap: 2, minWidth: 0 },
  title: {
    color: '#F4F4F5',
    fontFamily: 'DMSans-SemiBold',
    fontSize: 16,
  },
  date: { color: colors.mutedForeground, fontFamily: 'DMSans-Regular', fontSize: 14 },
  badges: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: 4 },
  badge: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeLabel: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 12 },
} as const;
