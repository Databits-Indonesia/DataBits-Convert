import { ShortcutsManager } from '../tools/shortcuts';

let initialized = false;

export function initializeGlobalShortcuts(): void {
  if (typeof window === 'undefined') return;
  if (initialized) return;

  ShortcutsManager.init();
  initialized = true;
}
