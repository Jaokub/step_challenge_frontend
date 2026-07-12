import React from 'react';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleProp, TextStyle } from 'react-native';
import AppText from './AppText';
import { gradients } from '../constants/theme';

const GRAD_START = { x: 0, y: 0 };
const GRAD_END = { x: 1, y: 1 };

interface GradientTextProps {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  /** Gradient stops — defaults to the brand teal→lime gradient. */
  colors?: readonly [string, string, ...string[]];
  variant?: 'heading-extraBold' | 'heading-bold' | 'body-bold';
}

/**
 * Renders text painted with a gradient fill (mimics CSS `background-clip: text`).
 * Central place for every screen that needs a gradient-filled number/label —
 * pull the gradient stops from `constants/theme.ts` (`gradients.*`) rather
 * than hardcoding a solid color, so brand updates propagate everywhere.
 */
const GradientText: React.FC<GradientTextProps> = ({
  children,
  style,
  colors: gradColors = gradients.primary,
  variant = 'heading-extraBold',
}) => (
  <MaskedView maskElement={<AppText variant={variant} style={style}>{children}</AppText>}>
    <LinearGradient colors={gradColors as any} start={GRAD_START} end={GRAD_END}>
      <AppText variant={variant} style={[style, { opacity: 0 }] as any}>
        {children}
      </AppText>
    </LinearGradient>
  </MaskedView>
);

export default GradientText;
