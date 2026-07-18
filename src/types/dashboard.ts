import { User, HealthRecord } from './user';
import { Activity, ActivityStatus, CheckIn } from './activity';

export interface PersonalDashboard {
  user: User;
  totalActivitiesJoined: number;
  totalPoints: number;
  currentStreak: number;
  recentCheckIns: CheckIn[];
  upcomingActivities: Activity[];
  todayHealth: HealthRecord | null;
}

export interface AdminDashboard {
  totalUsers: number;
  totalActivities: number;
  checkInsThisMonth: number;
  totalCheckIns: number;
  participationRate: number;
  mostActiveUsers: User[];
  mostPopularActivities: Activity[];
  recentCheckIns: CheckIn[];
}

export interface DashboardStats {
  activitiesByStatus: Record<ActivityStatus, number>;
  checkInsByMonth: Record<string, number>;
  newUsersByMonth: Record<string, number>;
}

export interface AggregateHealth {
  steps: number;
  calories: number;
  distanceKm: number;
  activeMinutes: number;
  daysWithData?: number;
}

export interface HealthSummary {
  today: HealthRecord | null;
  weeklyAverage: AggregateHealth | null;
  monthlyTotal: AggregateHealth | null;
  bestDay: HealthRecord | null;
}

export interface LeaderboardUser {
  rank: number;
  id: string;
  fullName: string;
  department: string;
  avatarUrl?: string;
  /** Ranking metric — cumulative step count. */
  steps: number;
  /** Dormant points cache; no longer shown in the UI. */
  totalPoints?: number;
}
