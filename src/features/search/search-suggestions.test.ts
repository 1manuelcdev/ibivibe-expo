import { describe, expect, it } from 'vitest';

import { getSuggestedCategories } from '@/features/search/search-suggestions';

describe('getSuggestedCategories', () => {
  it('returns useful defaults when the account has no interests', () => {
    expect(getSuggestedCategories('businesses', undefined, [])).toEqual([
      'Restaurantes',
      'Postos de Gasolina',
      'Hotéis e Pousadas',
      'Banhos',
      'Comércio',
      'Aventura',
      'Temáticos',
      'Fast food',
    ]);
  });

  it('puts the account interests before the defaults without duplicates', () => {
    expect(
      getSuggestedCategories('events', { events: ['music', 'sports'], businesses: [] }, [
        { id: 'music', name: 'Shows' },
        { id: 'sports', name: 'Esportivos' },
      ]),
    ).toEqual(['Shows', 'Esportivos', 'Religiosos', 'Cultura e Arte', 'Palestras']);
  });
});
