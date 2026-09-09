import type { QueryClient } from '@tanstack/react-query';

export function invalidateBusinessCaches(queryClient: QueryClient, businessId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: ['business-editor'], refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: ['owned-business'], refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: ['business', businessId], refetchType: 'active' }),
    queryClient.invalidateQueries({
      queryKey: ['business-gallery', businessId],
      refetchType: 'active',
    }),
    queryClient.invalidateQueries({ queryKey: ['home', 'businesses'], refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: ['search'], refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: ['favorites'], refetchType: 'active' }),
    queryClient.invalidateQueries({ queryKey: ['accounts'], refetchType: 'active' }),
  ]);
}
