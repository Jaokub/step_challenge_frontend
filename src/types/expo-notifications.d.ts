// The installed `expo-notifications` build ships without its bundled `.d.ts`
// declarations, so TypeScript can't resolve types for the module. This ambient
// declaration silences the "could not find declaration file" error by treating
// the module as untyped (any). Remove it if a future install restores the
// package's own type declarations under node_modules/expo-notifications/build.
declare module 'expo-notifications';
