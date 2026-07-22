import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { AppText, ScreenHeader } from '../../components';

interface FriendsHeaderSectionProps {
  requestsCount: number;
  onOpenRequests: () => void;
  onOpenAddFriend: () => void;
}

// Friends tab header — trimmed from the old combined Friends & Groups
// header (GroupHeaderSection) now that Groups has its own tab: drops the
// friends/group pill row and the "my groups" grid icon, keeps notifications
// bell + add-friend.
export const FriendsHeaderSection: React.FC<FriendsHeaderSectionProps> = ({
  requestsCount,
  onOpenRequests,
  onOpenAddFriend,
}) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <ScreenHeader
      title={t('groups.friends')}
      titleSize={21}
      rightActions={
        <>
          <TouchableOpacity
            onPress={onOpenRequests}
            style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
            accessibilityLabel={t('groups.friendRequests')}
          >
            <Ionicons name="notifications-outline" size={15} color={colors.textPrimary} />
            {requestsCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.error }]}>
                <AppText style={styles.badgeText}>{requestsCount}</AppText>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onOpenAddFriend}
            style={[styles.iconBtn, { backgroundColor: colors.inputBackground }]}
            accessibilityLabel={t('friend.addFriend')}
          >
            <Ionicons name="person-add-outline" size={15} color={colors.textPrimary} />
          </TouchableOpacity>
        </>
      }
    />
  );
};

const styles = StyleSheet.create({
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
});
