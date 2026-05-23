// Registry for the design-system preview sidebar. Each entry's `id` is the key
// used in the PARTS map in preview-screen.tsx. Adding a primitive preview =
// add a part file + a PARTS entry + a NavItem here.

export type NavGroup = 'Foundation' | 'Primitives' | 'Data' | 'Overlay & Feedback' | 'Navigation';

export interface NavItem {
  readonly label: string;
  readonly id: string;
  readonly group: NavGroup;
}

export const NAV_ITEMS: readonly NavItem[] = [
  // Foundation
  { label: 'Palette', id: 'palette', group: 'Foundation' },
  { label: 'Typography', id: 'type', group: 'Foundation' },
  // Primitives
  { label: 'Buttons', id: 'buttons', group: 'Primitives' },
  { label: 'Text', id: 'text', group: 'Primitives' },
  { label: 'Amount', id: 'amount', group: 'Primitives' },
  { label: 'Chips & badge', id: 'chips', group: 'Primitives' },
  { label: 'Inputs', id: 'inputs', group: 'Primitives' },
  { label: 'Selection', id: 'selection', group: 'Primitives' },
  { label: 'Hold to confirm', id: 'hold', group: 'Primitives' },
  // Data display
  { label: 'Band breakdown', id: 'bands', group: 'Data' },
  { label: 'Old vs new', id: 'comparison', group: 'Data' },
  { label: 'Inflows table', id: 'table', group: 'Data' },
  { label: 'Charts', id: 'charts', group: 'Data' },
  { label: 'Progress', id: 'progress', group: 'Data' },
  { label: 'Cards', id: 'cards', group: 'Data' },
  { label: 'Skeleton & empty', id: 'states', group: 'Data' },
  { label: 'Avatar', id: 'avatar', group: 'Data' },
  // Overlay & feedback
  { label: 'Modals', id: 'modals', group: 'Overlay & Feedback' },
  { label: 'Tooltip & popover', id: 'tooltip', group: 'Overlay & Feedback' },
  { label: 'Feedback', id: 'feedback', group: 'Overlay & Feedback' },
  { label: 'Cross-record', id: 'cross', group: 'Overlay & Feedback' },
  { label: 'Drawer service', id: 'drawer', group: 'Overlay & Feedback' },
  // Navigation
  { label: 'Top bar & rail', id: 'nav', group: 'Navigation' },
];

export const NAV_GROUPS: readonly NavGroup[] = [
  'Foundation',
  'Primitives',
  'Data',
  'Overlay & Feedback',
  'Navigation',
];
