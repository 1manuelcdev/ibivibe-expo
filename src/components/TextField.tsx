import { forwardRef, type ComponentProps } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Text, TextInput, View } from 'react-native';

import { colors } from '@/theme/tokens';

type TextFieldProps = ComponentProps<typeof TextInput> & {
  containerStyle?: StyleProp<ViewStyle>;
  error?: string;
  inputStyle?: StyleProp<TextStyle>;
  label?: string;
  required?: boolean;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { className: _className, containerStyle, error, inputStyle, label, required = false, style: _style, ...props },
  ref,
) {
  return (
    <View className="gap-2" style={containerStyle}>
      {label ? (
        <Text className="font-dm-medium text-base text-foreground">
          {label}
          {required ? <Text className="text-destructive"> *</Text> : null}
        </Text>
      ) : null}
      <TextInput
        ref={ref}
        placeholderTextColor={colors.mutedForeground}
        className="h-12 rounded-control border border-border bg-muted px-4 font-dm-medium text-base text-foreground"
        style={[error ? { borderColor: colors.destructive } : undefined, inputStyle]}
        {...props}
      />
      {error ? <Text className="font-dm text-xs text-red-300">{error}</Text> : null}
    </View>
  );
});
