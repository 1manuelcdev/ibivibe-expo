import { useQuery } from '@tanstack/react-query';

import { onboardingApi } from '@/features/onboarding/onboarding-api';
import type { TagTargetType } from '@/features/onboarding/models/onboarding-types';

export const onboardingQueryKeys = {
  cities: ['onboarding', 'cities'] as const,
  tagGroups: ['onboarding', 'tag-groups'] as const,
  tags: ['onboarding', 'tags'] as const,
};

export function useOnboardingInterestsData() {
  const tagGroups = useQuery({
    queryFn: onboardingApi.getTagGroups,
    queryKey: onboardingQueryKeys.tagGroups,
    staleTime: 10 * 60_000,
  });
  const tags = useQuery({
    queryFn: onboardingApi.getTags,
    queryKey: onboardingQueryKeys.tags,
    staleTime: 10 * 60_000,
  });

  return { tagGroups, tags };
}

export function useOnboardingTags(targetType: TagTargetType) {
  return useQuery({
    queryFn: () => onboardingApi.getTagsByTargetType(targetType),
    queryKey: [...onboardingQueryKeys.tags, targetType] as const,
    staleTime: 10 * 60_000,
  });
}

export function useOnboardingCities() {
  return useQuery({
    queryFn: onboardingApi.getCities,
    queryKey: onboardingQueryKeys.cities,
    staleTime: 0,
  });
}
