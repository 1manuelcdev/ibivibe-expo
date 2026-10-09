import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Animated, Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

export type ToastVariant = 'success' | 'info' | 'warning' | 'destructive';

const toastVariants = {
  destructive: {
    actionColor: '#FCA5A5',
    backgroundColor: '#3B1F22',
    borderColor: 'rgba(248,113,113,0.22)',
    icon: 'information-circle-outline' as const,
    iconColor: '#FCA5A5',
    progressColor: '#FCA5A5',
    textColor: '#FCA5A5',
  },
  info: {
    actionColor: colors.primary,
    backgroundColor: '#18181B',
    borderColor: colors.border,
    icon: 'information-circle-outline' as const,
    iconColor: colors.mutedForeground,
    progressColor: colors.mutedForeground,
    textColor: colors.foreground,
  },
  success: {
    actionColor: '#DCFCE7',
    backgroundColor: '#166534',
    borderColor: '#4ADE80',
    icon: 'checkmark-circle-outline' as const,
    iconColor: '#FFFFFF',
    progressColor: '#BBF7D0',
    textColor: '#FFFFFF',
  },
  warning: {
    actionColor: '#FEF3C7',
    backgroundColor: '#92400E',
    borderColor: '#FBBF24',
    icon: 'warning-outline' as const,
    iconColor: '#FFFFFF',
    progressColor: '#FEF3C7',
    textColor: '#FFFFFF',
  },
} as const;

export function Toast({
  actionLabel,
  duration = 3000,
  message,
  onAction,
  showProgress = false,
  variant = 'info',
  visible,
}: {
  actionLabel?: string;
  duration?: number;
  message: string;
  onAction?: () => void;
  showProgress?: boolean;
  variant?: ToastVariant;
  visible: boolean;
}) {
  const [progress] = useState(() => new Animated.Value(1));
  const appearance = toastVariants[variant];

  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(1);

    if (!visible || !showProgress) return;

    const animation = Animated.timing(progress, {
      duration,
      toValue: 0,
      useNativeDriver: false,
    });
    animation.start();

    return () => animation.stop();
  }, [duration, message, progress, showProgress, visible]);

  if (!visible) return null;

  return (
    <View
      accessibilityLiveRegion="polite"
      style={[
        styles.toast,
        { backgroundColor: appearance.backgroundColor, borderColor: appearance.borderColor },
      ]}
    >
      <Ionicons color={appearance.iconColor} name={appearance.icon} size={20} />
      <Text style={[styles.message, { color: appearance.textColor }]}>{message}</Text>
      {actionLabel && onAction ? (
        <Pressable onPress={onAction} style={styles.action}>
          <Text style={[styles.actionLabel, { color: appearance.actionColor }]}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      {showProgress ? (
        <View pointerEvents="none" style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progress,
              { backgroundColor: appearance.progressColor },
              { width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) },
            ]}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = {
  toast: {
    alignItems: 'center' as const,
    backgroundColor: '#1E3A8A',
    borderColor: '#60A5FA',
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
  message: { flex: 1, fontFamily: 'DMSans-Medium', fontSize: 13 },
  action: { paddingHorizontal: 4, paddingVertical: 8 },
  actionLabel: { fontFamily: 'DMSans-SemiBold', fontSize: 13 },
  progressTrack: {
    backgroundColor: 'rgba(255,255,255,0.22)',
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
    bottom: 0,
    height: 3,
    left: 0,
    overflow: 'hidden' as const,
    position: 'absolute' as const,
    right: 0,
  },
  progress: { height: '100%' as const },
} as const;
