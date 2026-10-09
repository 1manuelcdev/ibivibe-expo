import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function TagBadges({ tags }: { tags: string[] }) {
  const [availableWidth, setAvailableWidth] = useState(0);
  const visibleCount = useMemo(
    () => getVisibleTagCount(tags, availableWidth),
    [availableWidth, tags],
  );
  const hiddenCount = Math.max(tags.length - visibleCount, 0);

  if (!tags.length) return null;

  return (
    <View
      onLayout={(event) => setAvailableWidth(event.nativeEvent.layout.width)}
      style={styles.row}
    >
      {tags.slice(0, visibleCount).map((tag) => (
        <View key={tag} style={styles.badge}>
          <Text numberOfLines={1} style={styles.label}>
            {tag}
          </Text>
        </View>
      ))}
      {hiddenCount ? <Text style={styles.more}>+{hiddenCount}</Text> : null}
    </View>
  );
}

function getVisibleTagCount(tags: string[], availableWidth: number) {
  if (!availableWidth) return Math.min(tags.length, 2);

  let usedWidth = 0;
  let visibleCount = 0;

  for (const [index, tag] of tags.entries()) {
    const remainingCount = tags.length - index - 1;
    const tagWidth = estimateBadgeWidth(tag);
    const moreWidth = remainingCount ? estimateMoreWidth(remainingCount) + 4 : 0;

    if (visibleCount > 0 && usedWidth + tagWidth + moreWidth > availableWidth) break;

    usedWidth += tagWidth + 4;
    visibleCount += 1;
  }

  return Math.max(visibleCount, 1);
}

function estimateBadgeWidth(value: string) {
  return value.length * 6.8 + 18;
}

function estimateMoreWidth(count: number) {
  return String(count).length * 7 + 8;
}

const styles = {
  row: {
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    gap: 4,
    height: 24,
    minWidth: 0,
    overflow: 'hidden' as const,
  },
  badge: {
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 8,
    borderWidth: 1,
    flexShrink: 0,
    maxWidth: '100%' as const,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  label: { color: '#F4F4F5', fontFamily: 'DMSans-Medium', fontSize: 12 },
  more: { color: colors.mutedForeground, fontFamily: 'DMSans-Medium', fontSize: 12 },
} as const;
