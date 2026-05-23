// Registry for the design-system preview sidebar. Each entry's `id` is the key
// used in the PARTS map in preview-screen.tsx. Adding a primitive preview =
// add a part file + a PARTS entry + a NavItem here.

export type NavGroup = 'Foundation' | 'Primitives';

export interface NavItem {
  readonly label: string;
  readonly id: string;
  readonly group: NavGroup;
}

export const NAV_ITEMS: readonly NavItem[] = [
  { label: 'Palette', id: 'palette', group: 'Foundation' },
  { label: 'Typography', id: 'type', group: 'Foundation' },
  { label: 'Buttons', id: 'buttons', group: 'Primitives' },
  { label: 'Text', id: 'text', group: 'Primitives' },
];

export const NAV_GROUPS: readonly NavGroup[] = ['Foundation', 'Primitives'];
