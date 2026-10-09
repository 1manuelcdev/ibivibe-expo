type CoverMedia = { is_cover?: boolean; url: string };

export function getCoverUrl(media?: CoverMedia[]) {
  return media?.find((item) => item.is_cover)?.url ?? null;
}
