import React, { useState } from 'react';
import { TextInput, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CustomModal, PrimaryButton } from '../../../components';
import { useTheme } from '../../../contexts/ThemeContext';
import { spacing, fontSize, borderRadius } from '../../../constants/theme';
import type { FriendRequest } from '../../friend/services/friendService';
import { RequestCard } from '../../friend/components/RequestCard';

export type ModalType = 'NONE' | 'CREATE' | 'JOIN' | 'REQUESTS';

interface GroupActionModalsProps {
  modalType: ModalType;
  onClose: () => void;
  isSubmitting: boolean;
  onCreateGroup: (name: string, desc: string, onSuccess: () => void) => void;
  onJoinGroup: (code: string, onSuccess: () => void) => void;
  requests: FriendRequest[];
  onAcceptRequest: (id: string) => void;
  onRejectRequest: (userId: string) => void;
}

export function GroupActionModals({
  modalType,
  onClose,
  isSubmitting,
  onCreateGroup,
  onJoinGroup,
  requests,
  onAcceptRequest,
  onRejectRequest
}: GroupActionModalsProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [groupName, setGroupName] = useState('');
  const [groupDesc, setGroupDesc] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const handleCreateSuccess = () => {
    onClose();
    setGroupName('');
    setGroupDesc('');
  };

  const handleJoinSuccess = () => {
    onClose();
    setInviteCode('');
  };

  return (
    <>
      <CustomModal visible={modalType === 'CREATE'} onClose={onClose} title={t('groups.createGroup', 'Create Group')}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.groupName', 'Group Name')}
          placeholderTextColor={colors.textSecondary}
          value={groupName}
          onChangeText={setGroupName}
        />
        <TextInput
          style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.groupDescription', 'Description')}
          placeholderTextColor={colors.textSecondary}
          multiline
          numberOfLines={3}
          value={groupDesc}
          onChangeText={setGroupDesc}
        />
        <PrimaryButton 
          title={isSubmitting ? t('common.loading', 'Loading...') : t('groups.createGroup', 'Create Group')} 
          onPress={() => onCreateGroup(groupName, groupDesc, handleCreateSuccess)} 
          disabled={isSubmitting || !groupName.trim()} 
        />
      </CustomModal>

      <CustomModal visible={modalType === 'JOIN'} onClose={onClose} title={t('groups.joinGroup', 'Join Group')} description={t('groups.enterInviteCode', 'Enter Invite Code')}>
        <TextInput
          style={[styles.input, { color: colors.textPrimary, borderColor: colors.inputBorder }]}
          placeholder={t('groups.inviteCode', 'Invite Code')}
          placeholderTextColor={colors.textSecondary}
          value={inviteCode}
          onChangeText={setInviteCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <PrimaryButton 
          title={isSubmitting ? t('common.loading', 'Loading...') : t('groups.joinGroup', 'Join Group')} 
          onPress={() => onJoinGroup(inviteCode, handleJoinSuccess)} 
          disabled={isSubmitting || !inviteCode.trim()} 
        />
      </CustomModal>

      <CustomModal visible={modalType === 'REQUESTS'} onClose={onClose} title="Friend Requests">
        {requests.map(req => (
          <View key={req.id}>
            <RequestCard 
              request={req} 
              onAccept={onAcceptRequest} 
              onReject={onRejectRequest} 
            />
          </View>
        ))}
      </CustomModal>
    </>
  );
}

const styles = StyleSheet.create({
  input: {
    fontSize: fontSize.md,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
});
