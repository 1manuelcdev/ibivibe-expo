import type { ComponentProps, ReactNode } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

type ButtonProps = Omit<ComponentProps<typeof Pressable>, 'children'> & {
  children: ReactNode;
  labelClassName?: string;
  variant?: 'primary' | 'ghost';
};

/**
 * CTA base do app. O fallback nativo mantém ações primárias visíveis caso uma
 * alteração na cadeia de estilos do NativeWind não gere a classe de cor.
 */
export function Button({ children, className, disabled, labelClassName, style, variant = 'primary', ...props }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      {...props}
      accessibilityRole="button"
      className={`h-12 items-center justify-center rounded-button ${className ?? ''}`}
      disabled={disabled}
      style={(state) => [
        isPrimary && styles.primary,
        disabled && styles.disabled,
        state.pressed && styles.pressed,
        typeof style === 'function' ? style(state) : style,
      ]}
    >
      {typeof children === 'string' ? (
        <Text className={`font-dm-semibold text-sm ${isPrimary ? 'text-primary-foreground' : 'text-foreground'} ${labelClassName ?? ''}`}>
          {children}
        </Text>
      ) : (
        children
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.78 },
  primary: { backgroundColor: '#9FFF8B' },
});
