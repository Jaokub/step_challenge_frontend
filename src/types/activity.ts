import { User } from './user';

export type ActivityStatus = 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
export type CheckInMethod = 'QR' | 'MANUAL' | 'GPS';

export interface Activity {
  id: string;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  qrCode: string;
  createdById: string;
  status: ActivityStatus;
  maxParticipants?: number;
  imageUrl?: string;
  points: number;
  participantCount?: number;
  createdBy?: User;
  isCheckedIn?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CheckIn {
  id: string;
  userId: string;
  activityId: string;
  checkedInAt: string;
  latitude?: number;
  longitude?: number;
  method: CheckInMethod;
  activity?: Activity;
  user?: User;
}
