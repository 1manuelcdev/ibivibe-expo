import { useQuery } from '@tanstack/react-query';

import { businessEditorApi } from '@/features/businesses/business-editor-api';
import { useSessionStore } from '@/stores/session-store';

export function useOwnedBusiness() {
  const account = useSessionStore((state) => state.account);
  const accountId = account?.id;

  return useQuery({
    enabled: account?.type === 'business' && Boolean(accountId),
    queryFn: () => businessEditorApi.getForAccount(accountId!),
    queryKey: ['owned-business', accountId],
  });
}
