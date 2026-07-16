import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { thaiFonts, englishFonts } from '../constants/theme';

export type TextVariant = 'heading-extraBold' | 'heading-bold' | 'heading-medium' | 'heading-sm' | 'body-bold' | 'body-semiBold' | 'body-medium' | 'body-regular' | 'numeric';

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
}

// Thai Unicode block (0E00–0E7F). Anything in this range needs a Thai-capable
// font regardless of the app's current UI language — user-typed content
// (activity titles/descriptions, group names, ...) isn't translated, so it
// can be Thai even while the app is set to English, and vice versa. Exported
// so other components that render live-typed text outside of AppText (e.g.
// FormInput's TextInput in ActivityFormComponents.tsx) can apply the same
// font-selection rule instead of re-deriving it.
export const THAI_CHAR_REGEX = /[฀-๿]/;

/** Flatten a Text node's children down to a plain string for script detection. */
const extractText = (node: React.ReactNode): string => {
  if (node == null || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join('');
  if (React.isValidElement(node)) {
    const children = (node.props as { children?: React.ReactNode })?.children;
    return children ? extractText(children) : '';
  }
  return '';
};

const AppText: React.FC<AppTextProps> = ({ variant = 'body-regular', style, ...props }) => {
  const { i18n } = useTranslation();
  const { colors } = useTheme();

  // Base choice follows the app's UI language, but actual Thai content always
  // wins — otherwise Thai text typed while the app is in English mode renders
  // with no Thai glyph support at all (see AppText Thai-detection fix).
  const fonts = i18n.language === 'th' || THAI_CHAR_REGEX.test(extractText(props.children)) ? thaiFonts : englishFonts;
  
  let fontFamily: string = fonts.body.regular;
  let lineHeight: number = 22; // default
  
  switch (variant) {
    case 'heading-extraBold':
      fontFamily = fonts.heading.extraBold;
      lineHeight = 44;
      break;
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
      // Numbers alone always want the crisp Latin numeral glyphs, but a
      // numeric node can carry a Thai unit suffix in the same string (e.g.
      // "0 ก้าว") — if we force englishFonts unconditionally there, the Thai
      // word renders with no Thai glyph support. Same Thai-detection rule as
      // every other variant applies here too; only the "no Thai" branch
      // still forces the English numeral font regardless of UI language.
      fontFamily = THAI_CHAR_REGEX.test(extractText(props.children)) ? thaiFonts.body.bold : englishFonts.body.bold;
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
