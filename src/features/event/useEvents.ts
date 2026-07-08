import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import eventService from './eventService';
import { queryKeys } from '../../constants/queryKeys';
import type { EventScope } from '../../types';

/** List of all events. */
export function useEvents() {
  const query = useQuery({
    queryKey: queryKeys.events.list,
    queryFn: async () => {
      const res = await eventService.getEvents();
      if (!res.success) throw new Error('Failed to load events');
      return res.data;
    },
  });

  return {
    events: query.data ?? [],
    isLoading: query.isPending,
    isError: query.isError,
    isRefetching: query.isRefetching,
    refetch: query.refetch,
  };
}

/** One event's detail + stats, plus join/leave mutations. */
export function useEventDetail(eventId: string) {
  const queryClient = useQueryClient();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.events.all });
  };

  const eventQuery = useQuery({
    queryKey: queryKeys.events.detail(eventId),
    queryFn: async () => {
      const res = await eventService.getEvent(eventId);
      if (!res.success) throw new Error('Failed to load event');
      return res.data;
    },
    enabled: !!eventId,
  });

  const statsQuery = useQuery({
    queryKey: queryKeys.events.stats(eventId),
    queryFn: async () => {
      const res = await eventService.getStats(eventId);
      if (!res.success) throw new Error('Failed to load event stats');
      return res.data;
    },
    enabled: !!eventId,
  });

  const joinIndividual = useMutation({
    mutationFn: () => eventService.joinIndividual(eventId),
    onSuccess: invalidate,
  });

  const joinGroup = useMutation({
    mutationFn: (groupId: string) => eventService.joinGroup(eventId, groupId),
    onSuccess: invalidate,
  });

  const leave = useMutation({
    mutationFn: () => eventService.leave(eventId),
    onSuccess: invalidate,
  });

  return {
    event: eventQuery.data ?? null,
    stats: statsQuery.data ?? null,
    isLoading: eventQuery.isPending,
    isStatsLoading: statsQuery.isPending,
    joinIndividual,
    joinGroup,
    leave,
    isMutating: joinIndividual.isPending || joinGroup.isPending || leave.isPending,
  };
}

/** One event's leaderboard for a given scope (individual | group). */
export function useEventLeaderboard(eventId: string, scope: EventScope) {
  const query = useQuery({
    queryKey: queryKeys.events.leaderboard(eventId, scope),
    queryFn: async () => {
      const res = await eventService.getLeaderboard(eventId, scope);
      if (!res.success) throw new Error('Failed to load leaderboard');
      return res.data;
    },
    enabled: !!eventId,
  });

  return {
    leaderboard: query.data ?? null,
    isLoading: query.isPending,
  };
}
