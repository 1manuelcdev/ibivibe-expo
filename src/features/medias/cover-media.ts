import { normalizeImageUrl } from '@/utils/normalize-image-url';

type CoverMedia = { is_cover?: boolean; url: string };

export function getCoverUrl(media?: CoverMedia[]) {
  return normalizeImageUrl(media?.find((item) => item.is_cover)?.url);
}
