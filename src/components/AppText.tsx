import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { thaiFonts, englishFonts } from '../constants/theme';

export type TextVariant = 'heading-bold' | 'heading-medium' | 'heading-sm' | 'body-bold' | 'body-semiBold' | 'body-medium' | 'body-regular';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

const AppText: React.FC<AppTextProps> = ({ variant = 'body-regular', style, ...props }) => {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  
  // Choose the font family collection based on current language
  const fonts = i18n.language === 'th' ? thaiFonts : englishFonts;
  
  let fontFamily: string = fonts.body.regular;
  
  switch (variant) {
    case 'heading-bold':
      fontFamily = fonts.heading.bold;
      break;
    case 'heading-medium':
      fontFamily = fonts.heading.medium;
      break;
    case 'heading-sm':
      fontFamily = fonts.heading.medium; // Or another appropriate font
      break;
    case 'body-bold':
      fontFamily = fonts.body.bold;
      break;
    case 'body-semiBold':
      fontFamily = fonts.body.semiBold;
      break;
    case 'body-medium':
      fontFamily = fonts.body.medium;
      break;
    case 'body-regular':
    default:
      fontFamily = fonts.body.regular;
      break;
  }

  return (
    <Text 
      style={[{ fontFamily, color: colors.textPrimary }, style]} 
      {...props} 
    />
  );
};

export default AppText;
