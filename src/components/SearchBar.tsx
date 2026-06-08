import React from 'react';
import { View, TextInput, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { borderRadius, fontSize, spacing } from '../constants/theme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: StyleProp<ViewStyle>;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  style,
}) => {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.inputBackground,
          borderColor: colors.inputBorder,
        },
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={colors.inputPlaceholder}
        style={styles.icon}
      />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.inputPlaceholder}
        style={[
          styles.input,
          {
            color: colors.inputText,
          },
        ]}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value.length > 0 && (
        <Ionicons
          name="close-circle"
          size={20}
          color={colors.inputPlaceholder}
          onPress={() => onChangeText('')}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    paddingVertical: 0,
  },
});

export default SearchBar;
