/**
 * Central query-key factory. Every useQuery/useInfiniteQuery key in the app
 * must come from here so invalidations stay consistent.
 *
 * Hierarchy matters: invalidating `queryKeys.groups.all` also invalidates
 * every key that starts with ['groups'].
 */
export const queryKeys = {
  activities: {
    all: ['activities'] as const,
    list: (filter: string) => ['activities', 'list', filter] as const,
    detail: (id: string) => ['activities', 'detail', id] as const,
    checkins: (activityId: string) => ['activities', 'checkins', activityId] as const,
    // Distinct from `checkins` — that key backs qr.tsx's single-page,
    // 5s-polling live counter (only reads `totalCheckIns`, unaffected by
    // truncation). This backs attendees.tsx's paginate-until-exhausted full
    // list (BUILD_PLAN.md Phase 3.1); sharing one key risked the polling
    // query's truncated cache being read as fresh by the attendees screen.
    checkinsFull: (activityId: string) => ['activities', 'checkins', activityId, 'full'] as const,
    // Registration-only cascade (Phase 4) — distinct from `checkins` above.
    participants: (activityId: string) => ['activities', 'participants', activityId] as const,
  },
  dashboard: {
    personal: ['dashboard', 'personal'] as const,
    admin: ['dashboard', 'admin'] as const,
    stats: ['dashboard', 'stats'] as const,
  },
  health: {
    summary: ['health', 'summary'] as const,
    history: (limit: number) => ['health', 'history', limit] as const,
    weeklyChart: ['health', 'weeklyChart'] as const,
  },
  leaderboard: {
    global: (limit: number) => ['leaderboard', 'global', limit] as const,
    scoped: (groupId: string, startDate?: string, endDate?: string) =>
      ['leaderboard', 'scoped', groupId, startDate ?? 'none', endDate ?? 'none'] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: ['groups', 'list'] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
    members: (id: string) => ['groups', 'members', id] as const,
    qrcode: (id: string) => ['groups', 'qrcode', id] as const,
    overview: (id: string) => ['groups', 'overview', id] as const,
    siblings: (id: string) => ['groups', 'siblings', id] as const,
    // Phase 5 — hierarchy request/approve + admin god-mode.
    parentCandidates: (id: string, search: string) => ['groups', 'parentCandidates', id, search] as const,
    incomingRequests: (id: string) => ['groups', 'incomingRequests', id] as const,
    adminTree: ['groups', 'adminTree'] as const,
  },
  friends: {
    all: ['friends'] as const,
    list: ['friends', 'list'] as const,
    requests: ['friends', 'requests'] as const,
  },
  events: {
    all: ['events'] as const,
    list: ['events', 'list'] as const,
    detail: (id: string) => ['events', 'detail', id] as const,
    leaderboard: (id: string, scope: string) => ['events', 'leaderboard', id, scope] as const,
    stats: (id: string) => ['events', 'stats', id] as const,
  },
  users: {
    all: ['users'] as const,
    list: ['users', 'list'] as const,
    // Distinct from `list` — that key backs the single-page (limit=20)
    // admin/users.tsx query, this backs the paginate-until-exhausted full
    // roster (BUILD_PLAN.md Phase 3.1). Sharing one key would let either
    // screen's incomplete/complete cache leak into the other.
    fullList: ['users', 'list', 'full'] as const,
    profile: (id: string) => ['users', 'profile', id] as const,
    me: ['users', 'me'] as const,
    profileScreen: ['users', 'profileScreen'] as const,
  },
} as const;
