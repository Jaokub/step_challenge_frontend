import { useState, useCallback } from 'react';
import activityService from '../services/activityService';
import type { Activity } from '../../../types';

export function useActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const loadActivities = async (pageNumber: number, filter: string, isRefresh = false) => {
    try {
      const statusMap: Record<string, string> = {
        upcoming: 'UPCOMING',
        ongoing: 'ONGOING',
        past: 'COMPLETED'
      };
      
      const response = await activityService.getActivities({ 
        page: pageNumber, 
        limit: 10, 
        status: filter !== 'all' ? statusMap[filter] : undefined 
      });

      if (!response.success) {
        return; // Early return on failure
      }

      const newActivities = response.data.activities;
      
      if (isRefresh) {
        setActivities(newActivities);
      } else {
        setActivities(prev => [...prev, ...newActivities]);
      }
      
      setHasMore(response.data.pagination?.page < response.data.pagination?.totalPages);
    } catch (err) {
      console.warn('Activities fetch error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const refresh = useCallback(async (filter: string) => {
    setRefreshing(true);
    setPage(1);
    await loadActivities(1, filter, true);
  }, []);

  const fetchInitial = useCallback(async (filter: string) => {
    setLoading(true);
    setPage(1);
    await loadActivities(1, filter, true);
  }, []);

  const loadMore = useCallback(async (filter: string) => {
    if (hasMore && !loadingMore && !loading) {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      await loadActivities(nextPage, filter);
    }
  }, [hasMore, loadingMore, loading, page]);

  return {
    activities,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    refresh,
    fetchInitial,
    loadMore
  };
}
