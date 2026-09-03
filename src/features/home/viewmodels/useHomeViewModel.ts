import { useQuery } from '@tanstack/react-query';

import { homeApi } from '@/features/home/home-api';
import { useSessionStore } from '@/stores/session-store';

const HOME_STALE_TIME = 60_000;

export const homeQueryKeys = {
  businesses: ['home', 'businesses'] as const,
  cities: ['home', 'cities'] as const,
  events: ['home', 'events'] as const,
};

export function useHomeViewModel() {
  const account = useSessionStore((state) => state.account);
  const enabled = Boolean(account);

  const events = useQuery({
    enabled,
    queryFn: homeApi.getEvents,
    queryKey: homeQueryKeys.events,
    staleTime: HOME_STALE_TIME,
  });
  const businesses = useQuery({
    enabled,
    queryFn: homeApi.getBusinesses,
    queryKey: homeQueryKeys.businesses,
    staleTime: HOME_STALE_TIME,
  });
  const cities = useQuery({
    enabled,
    queryFn: homeApi.getCities,
    queryKey: homeQueryKeys.cities,
    staleTime: HOME_STALE_TIME,
  });

  return { businesses, cities, events };
}
