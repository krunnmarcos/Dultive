import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { COLORS } from '../constants/colors';

interface CustomButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'text';
  disabled?: boolean;
  style?: ViewStyle;
}

const CustomButton: React.FC<CustomButtonProps> = ({ title, onPress, variant = 'primary', disabled = false, style }) => {
  const containerStyle: ViewStyle[] = [styles.container, styles[variant], disabled ? styles.disabled : {}];
  if (style) containerStyle.push(style);
  const textStyle: TextStyle[] = [styles.textBase, styles[`text_${variant}`] as TextStyle];

  return (
    <TouchableOpacity onPress={onPress} style={containerStyle} disabled={disabled}>
      <Text style={textStyle}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  textBase: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  primary: {
    backgroundColor: COLORS.primary,
  },
  text_primary: {
    color: COLORS.card,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  text_outline: {
    color: COLORS.primary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  text_text: {
    color: COLORS.primary,
  },
  disabled: {
    backgroundColor: COLORS.icon,
  },
});

export default CustomButton;
