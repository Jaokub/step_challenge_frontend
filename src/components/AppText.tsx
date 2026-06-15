import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { thaiFonts, englishFonts } from '../constants/theme';

export type TextVariant = 'heading-bold' | 'heading-medium' | 'heading-sm' | 'body-bold' | 'body-semiBold' | 'body-medium' | 'body-regular' | 'numeric';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

const AppText: React.FC<AppTextProps> = ({ variant = 'body-regular', style, ...props }) => {
  const { i18n } = useTranslation();
  const { colors } = useTheme();
  
  // Choose the font family collection based on current language
  const fonts = i18n.language === 'th' ? thaiFonts : englishFonts;
  
  let fontFamily: string = fonts.body.regular;
  let lineHeight: number = 22; // default
  
  switch (variant) {
    case 'heading-bold':
      fontFamily = fonts.heading.bold;
      lineHeight = 40;
      break;
    case 'heading-medium':
      fontFamily = fonts.heading.medium;
      lineHeight = 36;
      break;
    case 'heading-sm':
      fontFamily = fonts.heading.medium; // Or another appropriate font
      lineHeight = 28;
      break;
    case 'body-bold':
      fontFamily = fonts.body.bold;
      lineHeight = 24;
      break;
    case 'body-semiBold':
      fontFamily = fonts.body.semiBold;
      lineHeight = 24;
      break;
    case 'body-medium':
      fontFamily = fonts.body.medium;
      lineHeight = 22;
      break;
    case 'numeric':
      fontFamily = englishFonts.body.bold; // DM Sans Bold always
      lineHeight = 26;
      break;
    case 'body-regular':
    default:
      fontFamily = fonts.body.regular;
      lineHeight = 22;
      break;
  }

  return (
    <Text 
      style={[{ fontFamily, lineHeight, color: colors.textPrimary }, style]} 
      {...props} 
    />
  );
};

export default AppText;
