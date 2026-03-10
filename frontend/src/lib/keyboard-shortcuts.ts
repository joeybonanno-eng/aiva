export interface KeyboardShortcut {
  id: string;
  key: string;
  meta: boolean;
  shift: boolean;
  alt: boolean;
  label: string;
  description: string;
  action: () => void;
}

export interface ShortcutDefinition {
  id: string;
  key: string;
  meta?: boolean;
  shift?: boolean;
  alt?: boolean;
  label: string;
  description: string;
}

/**
 * Predefined shortcut map for the AIVA workstation.
 * Actions are bound at registration time via registerShortcuts().
 */
export const SHORTCUT_MAP: Record<string, ShortcutDefinition> = {
  COMMAND_BAR: {
    id: "command-bar",
    key: "k",
    meta: true,
    label: "\u2318K",
    description: "Open command bar",
  },
  NEW_MEETING: {
    id: "new-meeting",
    key: "m",
    meta: true,
    label: "\u2318M",
    description: "New meeting",
  },
  MORNING_BRIEFING: {
    id: "morning-briefing",
    key: "b",
    meta: true,
    label: "\u2318B",
    description: "Morning briefing",
  },
};

type ShortcutActions = Record<string, () => void>;

/**
 * Registers global keyboard shortcuts with corresponding actions.
 * Returns a cleanup function that removes all event listeners.
 *
 * @example
 * ```ts
 * const cleanup = registerShortcuts({
 *   "command-bar": () => toggleCommandBar(),
 *   "new-meeting": () => router.push("/meetings?new=true"),
 *   "morning-briefing": () => router.push("/command-center"),
 * });
 *
 * // Later, in cleanup:
 * cleanup();
 * ```
 */
export function registerShortcuts(actions: ShortcutActions): () => void {
  const shortcuts: KeyboardShortcut[] = Object.values(SHORTCUT_MAP)
    .filter((def) => actions[def.id])
    .map((def) => ({
      ...def,
      meta: def.meta ?? false,
      shift: def.shift ?? false,
      alt: def.alt ?? false,
      action: actions[def.id],
    }));

  function handleKeyDown(e: KeyboardEvent) {
    for (const shortcut of shortcuts) {
      const metaMatch = shortcut.meta
        ? e.metaKey || e.ctrlKey
        : !e.metaKey && !e.ctrlKey;
      const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
      const altMatch = shortcut.alt ? e.altKey : !e.altKey;
      const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (metaMatch && shiftMatch && altMatch && keyMatch) {
        e.preventDefault();
        shortcut.action();
        return;
      }
    }
  }

  window.addEventListener("keydown", handleKeyDown);
  return () => window.removeEventListener("keydown", handleKeyDown);
}

/**
 * Returns an array of all defined shortcut definitions for display in help/UI.
 */
export function getShortcutList(): ShortcutDefinition[] {
  return Object.values(SHORTCUT_MAP);
}
