import React from 'react';
import { TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface HeaderIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  iconColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  style?: StyleProp<ViewStyle>;
}

const HeaderIconButton: React.FC<HeaderIconButtonProps> = ({
  icon,
  onPress,
  iconColor,
  backgroundColor,
  borderColor,
  style,
}) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.actionBtn,
        {
          backgroundColor: backgroundColor || colors.card,
          borderColor: borderColor || colors.cardBorder,
        },
        style,
      ]}
    >
      <Ionicons name={icon} size={20} color={iconColor || colors.textPrimary} />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeaderIconButton;
