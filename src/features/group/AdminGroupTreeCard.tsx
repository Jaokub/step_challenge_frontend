import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../components';
import { useTheme } from '../../contexts/ThemeContext';
import { adminAccents } from '../../constants/theme';
import type { AdminGroupTreeNode } from '../../types';

type ChildRef = { id: string; name: string };

interface TreeActions {
  onMoveParent: (child: ChildRef) => void;
  onDetach: (child: ChildRef) => void;
  onReassignCoordinator: (child: ChildRef) => void;
  onDelete: (child: ChildRef) => void;
  onOverrideApprove: (child: AdminGroupTreeNode, parentId: string, parentName: string) => void;
  busy: boolean;
}

interface AdminGroupTreeCardProps extends TreeActions {
  tree: AdminGroupTreeNode;
}

// Mockup frame 6 — a dark "root" card (background:#14201d, matches
// colors.textPrimary in the forced-light admin console exactly) with its
// children nested underneath via an L-shaped tree-line connector, N levels
// deep (Phase 5.1 — bounded by the backend's MAX_GROUP_DEPTH, previously
// assumed to be exactly one level). Any group with a still-PENDING request
// to join a node as parent is nested the same way, flagged `pending`, with
// an inline override-approve row — only the one "override อนุมัติ" button,
// matching the mockup (no deny here; deny still exists for the actual
// parent coordinator on /group/[id], or an admin can detach/reassign).
export default function AdminGroupTreeCard({ tree, ...actions }: AdminGroupTreeCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={[styles.rootCard, { backgroundColor: colors.textPrimary }]}>
        <View style={styles.rootHeader}>
          <AppText variant="body-bold" style={[styles.rootName, { color: adminAccents.onDark }]} numberOfLines={1}>
            {tree.name}
          </AppText>
          <View style={[styles.kindBadge, { backgroundColor: adminAccents.onDark + '24' }]}>
            <AppText style={styles.kindBadgeText}>
              {tree.kind === 'PARENT' ? t('admin.groupKindParent') : t('admin.groupKindStandalone')}
            </AppText>
          </View>
        </View>
        <AppText style={[styles.rootMeta, { color: adminAccents.onDark + 'A6' }]}>
          {t('groups.memberCountLabel', { count: tree.members })} ·{' '}
          {t('admin.coordinatorInline', { name: tree.coordinator ?? '-' })} ·{' '}
          {t('admin.childCountInline', { count: tree.childCount })}
        </AppText>
      </View>

      <ChildList nodes={tree.children} parentId={tree.id} parentName={tree.name} {...actions} />
    </View>
  );
}

interface ChildListProps extends TreeActions {
  nodes: AdminGroupTreeNode[];
  parentId: string;
  parentName: string;
}

// Recurses into each node's own children — the connector + paddingLeft on
// `childRow` compounds naturally at each nesting level, giving the deeper
// levels a cascading indent (file-explorer pattern).
function ChildList({ nodes, parentId, parentName, ...actions }: ChildListProps) {
  const { colors } = useTheme();
  if (nodes.length === 0) return null;

  return (
    <>
      {nodes.map((node) => (
        <View key={node.id} style={styles.childRow}>
          <View style={[styles.connector, { borderColor: colors.divider }]} />
          <View style={styles.childCol}>
            <ChildCard
              node={node}
              onMoveParent={actions.onMoveParent}
              onDetach={actions.onDetach}
              onReassignCoordinator={actions.onReassignCoordinator}
              onDelete={actions.onDelete}
              onOverridePress={() => actions.onOverrideApprove(node, parentId, parentName)}
              busy={actions.busy}
            />
            <ChildList nodes={node.children} parentId={node.id} parentName={node.name} {...actions} />
          </View>
        </View>
      ))}
    </>
  );
}

interface ChildCardProps {
  node: AdminGroupTreeNode;
  onMoveParent: (child: ChildRef) => void;
  onDetach: (child: ChildRef) => void;
  onReassignCoordinator: (child: ChildRef) => void;
  onDelete: (child: ChildRef) => void;
  onOverridePress: () => void;
  busy: boolean;
}

function ChildCard({ node, onMoveParent, onDetach, onReassignCoordinator, onDelete, onOverridePress, busy }: ChildCardProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const ref = { id: node.id, name: node.name };

  return (
    <View style={[styles.childCard, { backgroundColor: colors.card, borderColor: colors.cardBorder }]}>
      <View style={styles.childHeader}>
        <AppText variant="body-bold" style={[styles.childName, { color: colors.textPrimary }]} numberOfLines={1}>
          {node.name}
        </AppText>
        <AppText style={[styles.memberCount, { color: colors.textSecondary }]}>
          {t('groups.memberCountLabel', { count: node.members })}
        </AppText>
      </View>
      <AppText style={[styles.coordinatorLine, { color: colors.textSecondary }]}>
        {t('admin.coordinatorInline', { name: node.coordinator ?? '-' })}
      </AppText>

      {node.pending && (
        <View style={[styles.pendingRow, { backgroundColor: colors.warning + '1A' }]}>
          <AppText style={[styles.pendingText, { color: colors.warning }]}>
            {t('admin.pendingChildOf', { name: node.pendingParent ?? '-' })}
          </AppText>
          <TouchableOpacity disabled={busy} onPress={onOverridePress} style={[styles.miniBtn, { backgroundColor: colors.primary }]}>
            <AppText style={[styles.miniBtnText, { color: adminAccents.onDark }]}>
              {t('admin.overrideApprove')}
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity disabled={busy} onPress={() => onMoveParent(ref)} style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}>
          <AppText style={[styles.actionChipText, { color: colors.textPrimary }]}>{t('admin.actionMoveParent')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity disabled={busy} onPress={() => onDetach(ref)} style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}>
          <AppText style={[styles.actionChipText, { color: colors.textPrimary }]}>{t('admin.actionDetachParent')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity disabled={busy} onPress={() => onReassignCoordinator(ref)} style={[styles.actionChip, { backgroundColor: colors.inputBackground }]}>
          <AppText style={[styles.actionChipText, { color: colors.textPrimary }]}>{t('admin.actionReassignCoordinator')}</AppText>
        </TouchableOpacity>
        <TouchableOpacity disabled={busy} onPress={() => onDelete(ref)} style={[styles.actionChip, { backgroundColor: colors.error + '1A' }]}>
          <AppText style={[styles.actionChipText, { color: colors.error }]}>{t('admin.actionDeleteGroup')}</AppText>
        </TouchableOpacity>
      </View>
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
  kindBadgeText: { fontSize: 9.5, lineHeight: 12, fontWeight: '700' as any, color: adminAccents.onDark },
  // AppText's default (unspecified) lineHeight is a flat 22px regardless of
  // variant/fontSize — every small caption below explicitly overrides it,
  // otherwise a 10-11.5px line renders with ~2x its font-size in vertical
  // padding, which is what was bloating the card spacing vs the mockup.
  rootMeta: { fontSize: 11.5, lineHeight: 14, marginTop: 3 },
  childRow: { flexDirection: 'row', gap: 10, paddingLeft: 6 },
  childCol: { flex: 1, gap: 10 },
  // Mockup: width:14px;border-left:2px solid rgba(20,32,29,0.12);
  // border-bottom:2px solid rgba(20,32,29,0.12);border-radius:0 0 0 8px;
  // height:24px;margin-top:2px — only the bottom-left corner rounds, giving
  // the L-shaped elbow that connects a node to its child.
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
  childCard: { borderRadius: 18, borderWidth: 1, paddingVertical: 13, paddingHorizontal: 14, gap: 6 },
  childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  childName: { fontSize: 13.5, lineHeight: 16 },
  memberCount: { fontSize: 11, lineHeight: 13 },
  coordinatorLine: { fontSize: 11.5, lineHeight: 14 },
  // Mockup: border-radius:10px;padding:6px 10px;justify-content:space-between
  pendingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderRadius: 10, paddingVertical: 6, paddingHorizontal: 10 },
  pendingText: { flex: 1, fontSize: 10.5, lineHeight: 13, fontWeight: '600' as any },
  // Mockup: padding:4px 9px;border-radius:8px
  miniBtn: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8 },
  miniBtnText: { fontSize: 10, lineHeight: 12, fontWeight: '700' as any },
  actionRow: { flexDirection: 'row', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  actionChip: { flexGrow: 1, minWidth: 78, alignItems: 'center', paddingVertical: 6, borderRadius: 10 },
  actionChipText: { fontSize: 10, lineHeight: 12, fontWeight: '700' as any },
});
