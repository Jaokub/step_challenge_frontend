import { defineConfig } from 'vitest/config';

/**
 * Mobile-side unit tests.
 *
 * Deliberately narrow: this runs **pure logic** only — health-platform
 * services, sync orchestration, date/aggregation helpers. It is NOT a React
 * Native component test setup (no react-test-renderer, no RN transform), so
 * anything importing native modules must mock them at the module boundary.
 * That keeps the runner fast and avoids the usual Expo/Jest transform mess.
 *
 * Added 2026-07-19, after a permission-check bug in GoogleHealthService made
 * the Android health sync a silent no-op with nothing to catch it — the
 * mobile side had no test runner at all until then.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
    globals: false,
  },
});
