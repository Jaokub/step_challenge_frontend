import AppText from './AppText';
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../contexts/ThemeContext';
import { gradients } from '../constants/theme';

interface AvatarCircleProps {
  uri?: string;
  name: string;
  size?: number;
  ringColor?: string;
  /**
   * Solid teal→lime gradient squircle (radius ≈ size/3) instead of the
   * default translucent ring-circle — matches the profile mockup's avatar
   * treatment and the CLAUDE.md convention of gradient fills for avatars.
   * Opt-in so existing ring-circle callers (leaderboard rows) are unaffected.
   */
  squircle?: boolean;
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const AvatarCircle: React.FC<AvatarCircleProps> = ({
  uri,
  name,
  size = 48,
  ringColor,
  squircle = false,
}) => {
  const { colors } = useTheme();

  if (squircle) {
    const radius = Math.round(size / 3);
    return (
      <LinearGradient
        colors={gradients.primary as any}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.squircle, { width: size, height: size, borderRadius: radius }]}
      >
        {uri ? (
          <Image source={{ uri }} style={{ width: size, height: size, borderRadius: radius }} />
        ) : (
          <AppText style={[styles.initials, { color: colors.onPrimary, fontSize: Math.round(size * 0.364) }]}>
            {getInitials(name)}
          </AppText>
        )}
      </LinearGradient>
    );
  }

  const ring = ringColor ?? colors.primary;
  const ringWidth = Math.max(2, Math.round(size / 20));
  const innerSize = size - ringWidth * 2;

  return (
    <View
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: ringWidth,
          borderColor: ring,
        },
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.fallback,
            {
              width: innerSize,
              height: innerSize,
              borderRadius: innerSize / 2,
              backgroundColor: colors.primaryLight + '30',
            },
          ]}
        >
          <AppText
            style={[
              styles.initials,
              {
                color: colors.primary,
                fontSize: Math.round(size * 0.3),
              },
            ]}
          >
            {getInitials(name)}
          </AppText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  ring: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  squircle: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
  },
});

export default AvatarCircle;
