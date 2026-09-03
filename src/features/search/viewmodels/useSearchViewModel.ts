import { useQuery } from '@tanstack/react-query';

import { searchApi } from '@/features/search/search-api';

export function useSearchViewModel(query: string) {
  const normalizedQuery = query.trim();
  const search = useQuery({
    enabled: normalizedQuery.length >= 2,
    queryFn: () => searchApi.search(normalizedQuery),
    queryKey: ['search', normalizedQuery],
  });

  return { normalizedQuery, search };
}
