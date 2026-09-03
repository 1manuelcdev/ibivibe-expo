import { useQuery } from '@tanstack/react-query';

import { detailApi } from '@/features/details/detail-api';

export function useDetailViewModel(kind: 'city' | 'event' | 'business', id: string) {
  const city = useQuery({
    enabled: kind === 'city',
    queryFn: async () => ({ ...(await detailApi.city(id)), media: await detailApi.cityMedia(id) }),
    queryKey: ['city', id],
  });
  const event = useQuery({
    enabled: kind === 'event',
    queryFn: () => detailApi.event(id),
    queryKey: ['event', id],
  });
  const business = useQuery({
    enabled: kind === 'business',
    queryFn: () => detailApi.business(id),
    queryKey: ['business', id],
  });
  return kind === 'city' ? city : kind === 'event' ? event : business;
}
