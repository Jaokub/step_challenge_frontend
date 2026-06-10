import { Role } from './common';

export type HealthSource = 'GOOGLE_HEALTH' | 'APPLE_HEALTH' | 'MANUAL';

export interface User {
  id: string;
  email: string;
  fullName: string;
  nickname?: string;
  department: string;
  role: Role;
  avatarUrl?: string;
  totalPoints: number;
  syncToken: string;
  stats?: {
    totalCheckIns: number;
    totalActivities: number;
    totalGroups: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecord {
  id: string;
  userId: string;
  recordDate: string;
  steps: number;
  calories: number;
  distanceKm: number;
  activeMinutes: number;
  source: HealthSource;
  createdAt: string;
}
