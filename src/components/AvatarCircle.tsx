import AppText from './AppText';
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize } from '../constants/theme';

interface AvatarCircleProps {
  uri?: string;
  name: string;
  size?: number;
  ringColor?: string;
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
}) => {
  const { colors } = useTheme();
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
