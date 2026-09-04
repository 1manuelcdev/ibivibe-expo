import type { ComponentProps, ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: ReactNode;
  labelClassName?: string;
  variant?: 'primary' | 'ghost';
};

/**
 * CTA base do app. A camada visual fica fora do Pressable, que é adaptado pelo
 * NativeWind; assim a cor crítica não depende do adaptador de classes.
 */
export function Button({ children, className, disabled, labelClassName, style, variant = 'primary', ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <View className="h-12 overflow-hidden rounded-button" style={isPrimary ? { backgroundColor: '#9FFF8B' } : undefined}>
      <Pressable
        {...props}
        accessibilityRole="button"
        className={`flex-1 items-center justify-center ${className ?? ''}`}
        disabled={disabled}
        style={(state) => [
          disabled && { opacity: 0.5 },
          state.pressed && { opacity: 0.78 },
          typeof style === 'function' ? style(state) : style,
        ]}
      >
        {typeof children === 'string' ? (
          <Text className={`font-dm-semibold text-base ${isPrimary ? 'text-primary-foreground' : 'text-foreground'} ${labelClassName ?? ''}`}>
            {children}
          </Text>
        ) : (
          children
        )}
      </Pressable>
    </View>
  );
}
