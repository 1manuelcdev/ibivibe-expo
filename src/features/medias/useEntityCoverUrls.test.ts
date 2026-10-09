import { describe, expect, it } from 'vitest';

import { getCoverUrl } from '@/features/medias/cover-media';

describe('getCoverUrl', () => {
  it('uses only the media explicitly marked as cover', () => {
    expect(
      getCoverUrl([
        { is_cover: false, url: 'https://cdn.example.com/first.jpg' },
        { is_cover: true, url: 'https://cdn.example.com/cover.jpg' },
      ]),
    ).toBe('https://cdn.example.com/cover.jpg');
  });

  it('does not fall back to the first media when no cover exists', () => {
    expect(getCoverUrl([{ is_cover: false, url: 'https://cdn.example.com/1.jpg' }])).toBeNull();
  });
});
