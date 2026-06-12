import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withRepeat,
  withSpring
} from 'react-native-reanimated';
import AppText from './AppText';
import PrimaryButton from './PrimaryButton';
import { useTheme } from '../contexts/ThemeContext';
import { fontSize, spacing } from '../constants/theme';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'เกิดข้อผิดพลาดบางอย่าง',
  message = 'ไม่สามารถโหลดข้อมูลได้ในขณะนี้ กรุณาลองใหม่อีกครั้ง',
  onRetry,
  retryLabel = 'ลองใหม่อีกครั้ง',
}) => {
  const { colors } = useTheme();
  
  // Animation values
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const shake = useSharedValue(0);

  useEffect(() => {
    // Entrance animation
    scale.value = withSpring(1, { damping: 12 });
    opacity.value = withTiming(1, { duration: 500 });
    
    // Shake animation for error icon
    shake.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 }),
        withTiming(0, { duration: 1500 }) // pause between shakes
      ),
      -1 // infinite repeat
    );
  }, []);

  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shake.value }],
    };
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, animatedContainerStyle]}>
        <Animated.View 
          style={[
            styles.iconContainer, 
            { backgroundColor: colors.error + '15' },
            animatedIconStyle
          ]}
        >
          <Ionicons name="warning-outline" size={56} color={colors.error} />
        </Animated.View>
        
        <AppText style={[styles.title, { color: colors.textPrimary }]}>
          {title}
        </AppText>
        
        <AppText style={[styles.message, { color: colors.textSecondary }]}>
          {message}
        </AppText>
        
        {onRetry && (
          <View style={styles.buttonContainer}>
            <PrimaryButton 
              title={retryLabel} 
              onPress={onRetry} 
              style={{ backgroundColor: colors.error }}
            />
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: fontSize.xl,
    textAlign: 'center',
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  message: {
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  buttonContainer: {
    width: '100%',
    minWidth: 200,
  }
});

export default ErrorState;
