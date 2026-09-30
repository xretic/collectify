import { hashKey, type QueryClient } from '@tanstack/react-query';
import { sessionUserQueryKey } from './queryKeys';
import type { SessionUser } from './types';

const sessionUserHash = hashKey(sessionUserQueryKey);

/**
 * Puts another account in the cache (sign in, sign out, leaving impersonation). Everything the
 * previous one cached is dropped, but the session query itself stays and is updated, so its
 * mounted observers hear about the new user. `queryClient.clear()` would orphan them: a
 * component that does not re-render on navigation (the realtime connection) kept the old user
 * until a reload.
 */
export function switchSessionUser(queryClient: QueryClient, user: SessionUser | null) {
    queryClient.removeQueries({ predicate: (query) => query.queryHash !== sessionUserHash });
    queryClient.setQueryData<SessionUser | null>(sessionUserQueryKey, user);
}
