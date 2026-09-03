import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { favoritesApi } from '@/features/favorites/favorites-api';
import { useSessionStore } from '@/stores/session-store';

export function useFavoritesViewModel() {
  const accountId = useSessionStore((state) => state.account?.id);
  const queryClient = useQueryClient();
  const favorites = useQuery({
    enabled: Boolean(accountId),
    queryFn: () => favoritesApi.list(accountId!),
    queryKey: ['favorites', accountId],
  });
  const remove = useMutation({
    mutationFn: favoritesApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', accountId] }),
  });
  const add = useMutation({
    mutationFn: favoritesApi.add,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites', accountId] }),
  });

  return { accountId, add, favorites, remove };
}
