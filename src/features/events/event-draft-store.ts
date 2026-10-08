import { create } from 'zustand';

import type { PreparedImage } from '@/features/businesses/image-upload-service';

export type EventDraftMedia = {
  isCover?: boolean;
  isVideo?: boolean;
  mimeType?: string;
  name: string;
  prepared?: PreparedImage;
  uri: string;
};

type EventDraftStore = {
  media: EventDraftMedia[];
  addMedia: (media: EventDraftMedia[]) => void;
  removeMedia: (index: number) => EventDraftMedia | undefined;
  reorderMedia: (from: number, to: number) => void;
  clear: () => void;
};

export const useEventDraftStore = create<EventDraftStore>((set, get) => ({
  media: [],
  addMedia: (media) => set((state) => ({ media: [...state.media, ...media] })),
  removeMedia: (index) => {
    const item = get().media[index];
    set((state) => ({ media: state.media.filter((_, itemIndex) => itemIndex !== index) }));
    return item;
  },
  reorderMedia: (from, to) =>
    set((state) => {
      if (from < 0 || to < 0 || from >= state.media.length || to >= state.media.length) {
        return state;
      }
      const media = [...state.media];
      [media[from], media[to]] = [media[to], media[from]];
      return { media };
    }),
  clear: () => set({ media: [] }),
}));
