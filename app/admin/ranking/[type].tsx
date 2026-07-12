// Deprecated: not a screen in the mockup (`Admin and Group Coor Console
// Mockups_2.dc.html`) and its previous implementation rendered fabricated
// data (`generateExtendedMockData`), which violates the "never fake data"
// rule in BUILD_PLAN.md. Could not be deleted from this environment (sandbox
// mount permission), so it redirects to the real activities list instead of
// staying reachable as dead/fake-data code.
import { useEffect } from 'react';
import { router } from 'expo-router';

export default function DeprecatedRankingRedirect() {
  useEffect(() => {
    router.replace('/admin/activities');
  }, []);

  return null;
}
