import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useCameraPermissions } from 'expo-camera';

/**
 * Camera-permission gate for the scan icon on the home screen. Scan is no
 * longer a tab with its own in-app permission pre-screen — permission is
 * resolved right here, before ever navigating to /scan:
 *
 *  - already granted            -> push /scan directly
 *  - not yet asked / can re-ask -> trigger the OS's native prompt; push
 *                                  /scan only if the user allows it, do
 *                                  nothing on deny (tapping the icon again
 *                                  re-prompts, since canAskAgain stays true)
 *  - permanently refused        -> show an explainer + "Open Settings" modal
 *                                  (requestPermission() would silently no-op
 *                                  here, same bug this was built to avoid on
 *                                  the old in-app screen)
 */
export function useScanAccess() {
  const router = useRouter();
  const [permission, requestPermission] = useCameraPermissions();
  const [showExplainer, setShowExplainer] = useState(false);

  const requestScanAccess = useCallback(async () => {
    if (!permission) return; // permission state hasn't loaded yet

    if (permission.granted) {
      router.push('/scan');
      return;
    }

    if (permission.canAskAgain) {
      const result = await requestPermission();
      if (result.granted) {
        router.push('/scan');
      }
      return;
    }

    setShowExplainer(true);
  }, [permission, requestPermission, router]);

  return {
    requestScanAccess,
    showExplainer,
    closeExplainer: () => setShowExplainer(false),
  };
}
