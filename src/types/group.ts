import { User } from './user';

export type GroupMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface AppGroup {
  id: string;
  name: string;
  description?: string;
  qrInviteCode: string;
  createdById: string;
  createdBy?: User;
  members?: GroupMember[];
  createdAt: string;
  updatedAt: string;
}

export interface GroupMember {
  id: string;
  groupId: string;
  userId: string;
  role: GroupMemberRole;
  joinedAt: string;
  user?: User;
  group?: AppGroup;
}
