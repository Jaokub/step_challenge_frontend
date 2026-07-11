// Deprecated: superseded by app/admin/activities/[id]/attendees.tsx (plural,
// matches BUILD_PLAN.md Phase 1 routing). Kept as a redirect only — this file
// could not be deleted from this environment (sandbox mount permission),
// so it stays as a thin pass-through instead of dead/broken code.
import { useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function DeprecatedAttendeesRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    router.replace(`/admin/activities/${id}/attendees`);
  }, [id]);

  return null;
}
