import { useQueries } from '@tanstack/react-query';

import { detailApi, type DetailMedia } from '@/features/details/detail-api';
import { eventApi } from '@/features/events/event-api';
import type { EventMedia } from '@/features/events/models/event-types';
import { getCoverUrl } from '@/features/medias/cover-media';

type CoverEntityType = 'city' | 'event';
type CoverMedia = DetailMedia | EventMedia;

export function useEntityCoverUrls(type: CoverEntityType, entityIds: string[]) {
  const uniqueIds = [...new Set(entityIds)];
  const queries = useQueries({
    queries: uniqueIds.map((id) => ({
      queryFn: () => (type === 'city' ? detailApi.cityMedia(id) : eventApi.getMedia(id)),
      queryKey: ['media', type, id],
      staleTime: 60_000,
    })),
  });

  const urls = new Map<string, string | null>();
  for (const [index, id] of uniqueIds.entries()) {
    const media = queries[index]?.data as CoverMedia[] | undefined;
    urls.set(id, getCoverUrl(media));
  }
  return urls;
}
