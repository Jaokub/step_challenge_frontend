import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { adminAccents } from '../../constants/theme';
import type { AdminGroupTree, AdminGroupTreeChild } from '../../types';

interface AdminGroupTreeCardProps {
  tree: AdminGroupTree;
  onMoveParent: (child: { id: string; name: string }) => void;
  onDetach: (child: { id: string; name: string }) => void;
  onReassignCoordinator: (child: { id: string; name: string }) => void;
  onDelete: (child: { id: string; name: string }) => void;
  onOverrideApprove: (child: AdminGroupTreeChild, parentId: string, parentName: string) => void;
  busy: boolean;
}

// Mockup frame 6 — a dark "root" card (background:#14201d, matches
// colors.textPrimary in the forced-light admin console exactly) with its
// actual children nested underneath via an L-shaped tree-line connector,
// plus any group with a still-PENDING request to join this root shown the
// same way but flagged `pending` with an inline override-approve row. The
// mockup's pending row has only the one "override อนุมัติ" button — no deny
// affordance here (deny still exists for the parent's own coordinator on
// /group/[id]; an admin can also just detach/reassign the child instead).
export default function AdminGroupTreeCard({
  tree,
  onMoveParent,
  onDetach,
  onReassignCoordinator,
  onDelete,
  onOverrideApprove,
  busy,
}: AdminGroupTreeCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.rootCard, { backgroundColor: colors.textPrimary }]}>
        <View style={styles.rootHeader}>
          <AppText variant="body-bold" style={[styles.rootName, { color: adminAccents.onDark }]} numberOfLines={1}>
            {tree.root.name}
          </AppText>
          <View style={[styles.kindBadge, { backgroundColor: adminAccents.onDark + '24' }]}>
            <AppText style={{ fontSize: 9.5, fontWeight: '700' as any, color: adminAccents.onDark }}>
              {tree.root.kind === 'PARENT' ? t('admin.groupKindParent') : t('admin.groupKindStandalone')}
            </AppText>
          </View>
        </View>
        <AppText style={[styles.rootMeta, { color: adminAccents.onDark + 'A6' }]}>
          {t('groups.memberCountLabel', { count: tree.root.members })} ·{' '}
          {t('admin.coordinatorInline', { name: tree.root.coordinator ?? '-' })} ·{' '}
          {t('admin.childCountInline', { count: tree.root.childCount })}
        </AppText>
      </View>

      {tree.children.map((child) => (
        <View key={child.id} style={styles.childRow}>
          <View style={styles.connector} />
          <View style={[styles.childCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
            <View style={styles.childHeader}>
              <AppText variant="body-bold" style={[styles.childName, { color: colors.textPrimary }]} numberOfLines={1}>
                {child.name}
              </AppText>
              <AppText style={{ fontSize: 11, color: colors.textSecondary }}>
                {t('groups.memberCountLabel', { count: child.members })}
              </AppText>
            </View>
            <AppText style={{ fontSize: 11.5, color: colors.textSecondary }}>
              {t('admin.coordinatorInline', { name: child.coordinator ?? '-' })}
            </AppText>

            {child.pending && (
              <View style={[styles.pendingRow, { backgroundColor: colors.warning + '1A' }]}>
                <AppText style={{ flex: 1, fontSize: 10.5, fontWeight: '600' as any, color: colors.warning }}>
                  {t('admin.pendingChildOf', { name: child.pendingParent ?? '-' })}
                </AppText>
                <TouchableOpacity
                  disabled={busy}
                  onPress={() => onOverrideApprove(child, tree.root.id, tree.root.name)}
                  style={[styles.miniBtn, { backgroundColor: colors.primary }]}
                >
                  <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: adminAccents.onDark }}>
                    {t('admin.overrideApprove')}
                  </AppText>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.actionRow}>
              <TouchableOpacity
                disabled={busy}
                onPress={() => onMoveParent({ id: child.id, name: child.name })}
                style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}
              >
                <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.textPrimary }}>
                  {t('admin.actionMoveParent')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                onPress={() => onDetach({ id: child.id, name: child.name })}
                style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}
              >
                <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.textPrimary }}>
                  {t('admin.actionDetachParent')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                onPress={() => onReassignCoordinator({ id: child.id, name: child.name })}
                style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}
              >
                <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.textPrimary }}>
                  {t('admin.actionReassignCoordinator')}
                </AppText>
              </TouchableOpacity>
              <TouchableOpacity
                disabled={busy}
                onPress={() => onDelete({ id: child.id, name: child.name })}
                style={[styles.actionChip, { backgroundColor: colors.error + '1A' }]}
              >
                <AppText style={{ fontSize: 10, fontWeight: '700' as any, color: colors.error }}>
                  {t('admin.actionDeleteGroup')}
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  // Mockup: border-radius:20px; padding:15px 16px
  rootCard: { borderRadius: 20, paddingVertical: 15, paddingHorizontal: 16 },
  rootHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 },
  rootName: { flex: 1, fontSize: 15, lineHeight: 18 },
  kindBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 999, flexShrink: 0 },
  rootMeta: { fontSize: 11.5, marginTop: 3 },
  childRow: { flexDirection: 'row', gap: 10, paddingLeft: 6 },
  // Mockup: width:14px;border-left:2px solid rgba(20,32,29,0.12);
  // border-bottom:2px solid rgba(20,32,29,0.12);border-radius:0 0 0 8px;
  // height:24px;margin-top:2px — only the bottom-left corner rounds, giving
  // the L-shaped elbow that connects a root to its child.
  connector: {
    width: 14,
    flexShrink: 0,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: 'rgba(20,32,29,0.12)',
    borderBottomLeftRadius: 8,
    height: 24,
    marginTop: 2,
  },
  // Mockup: border-radius:18px;padding:13px 14px;gap:6px
  childCard: { flex: 1, borderRadius: 18, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 14, gap: 6 },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  childName: { fontSize: 13.5, lineHeight: 16 },
  // Mockup: border-radius:10px;padding:6px 10px;justify-content:space-between
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  // Mockup: padding:4px 9px;border-radius:8px
  miniBtn: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  actionChip: { flexGrow: 1, minWidth: 78, alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
});
