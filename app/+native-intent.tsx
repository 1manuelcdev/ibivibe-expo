import { getVerificationRoute } from '@/utils/deep-link';

export function redirectSystemPath({ path }: { initial: boolean; path: string }) {
  try {
    return getVerificationRoute(path) ?? path;
  } catch {
    return path;
  }
}
