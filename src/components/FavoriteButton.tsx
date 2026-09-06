import { Ionicons } from '@expo/vector-icons';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { colors } from '@/theme/tokens';

type FavoriteButtonProps = {
  disabled?: boolean;
  isFavorite: boolean;
  onPress: () => void | Promise<void>;
  size?: number;
};

export function FavoriteButton({
  disabled = false,
  isFavorite,
  onPress,
  size = 24,
}: FavoriteButtonProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  function handlePress() {
    scale.set(withSequence(withTiming(1.28, { duration: 120 }), withSpring(1, { damping: 9 })));
    void onPress();
  }

  return (
    <Pressable
      accessibilityLabel={isFavorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      accessibilityRole="button"
      disabled={disabled}
      hitSlop={12}
      onPress={handlePress}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          color={isFavorite ? colors.primary : colors.mutedForeground}
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size}
        />
      </Animated.View>
    </Pressable>
  );
}
