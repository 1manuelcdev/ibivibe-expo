import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/theme/tokens';

const transitionDuration = 260;

export function BottomSheet({
  children,
  onClose,
  visible,
}: {
  children: React.ReactNode;
  onClose: () => void;
  visible: boolean;
}) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const [mounted, setMounted] = useState(visible);
  const mountFrame = useRef<ReturnType<typeof requestAnimationFrame> | null>(null);
  const progress = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      mountFrame.current = requestAnimationFrame(() => {
        setMounted(true);
        progress.set(
          withTiming(1, { duration: transitionDuration, easing: Easing.out(Easing.cubic) }),
        );
      });
      return () => {
        if (mountFrame.current) cancelAnimationFrame(mountFrame.current);
      };
    }
    progress.set(
      withTiming(
        0,
        { duration: transitionDuration - 40, easing: Easing.in(Easing.cubic) },
        (finished) => {
          if (finished) runOnJS(setMounted)(false);
        },
      ),
    );
  }, [progress, visible]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 1], [0, 1]),
  }));
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(progress.value, [0, 1], [height, 0]) }],
  }));

  if (!mounted) return null;

  return (
    <Modal animationType="none" onRequestClose={onClose} transparent visible>
      <View style={styles.modal}>
        <Animated.View style={[styles.backdrop, backdropStyle]}>
          <Pressable
            accessibilityLabel="Fechar"
            onPress={onClose}
            style={styles.backdropPressable}
          />
        </Animated.View>
        <Animated.View
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }, sheetStyle]}
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = {
  modal: { flex: 1, justifyContent: 'flex-end' as const },
  backdrop: {
    backgroundColor: 'rgba(0,0,0,0.58)',
    bottom: 0,
    left: 0,
    position: 'absolute' as const,
    right: 0,
    top: 0,
  },
  backdropPressable: { flex: 1 },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '88%' as const,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  handle: {
    alignSelf: 'center' as const,
    backgroundColor: colors.mutedForeground,
    borderRadius: 24,
    height: 4,
    marginBottom: 16,
    opacity: 0.9,
    width: 64,
  },
} as const;
