type SearchInterestGroups = {
  businesses?: string[];
  events?: string[];
};

const defaultBusinessCategories = [
  'Restaurantes',
  'Postos de Gasolina',
  'Hotéis e Pousadas',
  'Banhos',
  'Comércio',
  'Aventura',
  'Temáticos',
  'Fast food',
];

const defaultEventCategories = ['Religiosos', 'Shows', 'Esportivos', 'Cultura e Arte', 'Palestras'];

export function getSuggestedCategories(
  kind: keyof SearchInterestGroups,
  interests: SearchInterestGroups | undefined,
  tags: Array<{ id: string; name: string }> | undefined,
) {
  const defaults = kind === 'businesses' ? defaultBusinessCategories : defaultEventCategories;
  const tagNamesById = new Map((tags ?? []).map((tag) => [tag.id, tag.name]));
  const personalized = (interests?.[kind] ?? [])
    .map((interestId) => tagNamesById.get(interestId))
    .filter((name): name is string => Boolean(name));

  return [...new Set([...personalized, ...defaults])];
}
