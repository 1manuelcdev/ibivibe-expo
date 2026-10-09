import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export function Toast({
  actionLabel,
  message,
  onAction,
  visible,
}: {
  actionLabel?: string;
  message: string;
  onAction?: () => void;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <View accessibilityLiveRegion="polite" style={styles.toast}>
      <Ionicons color={colors.foreground} name="information-circle-outline" size={20} />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={styles.actionLabel}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = {
  toast: {
    alignItems: 'center' as const,
    backgroundColor: '#27272A',
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    bottom: 24,
    elevation: 8,
    flexDirection: 'row' as const,
    gap: 10,
    left: 16,
    minHeight: 52,
    paddingHorizontal: 14,
    paddingVertical: 10,
    position: 'absolute' as const,
    right: 16,
    shadowColor: '#000000',
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    zIndex: 10,
  },
  message: { color: colors.foreground, flex: 1, fontFamily: 'DMSans-Medium', fontSize: 13 },
  action: { paddingHorizontal: 4, paddingVertical: 8 },
  actionLabel: { color: colors.primary, fontFamily: 'DMSans-SemiBold', fontSize: 13 },
} as const;
