// Theme
export * from './theme/index.js';

// Utils
export { cn } from './utils/cn.js';

// ── Primitives ──────────────────────────────────────────────────────────────
export { AppButton } from './primitives/app-button/index.js';
export type {
  AppButtonVariant,
  AppButtonSize,
  AppButtonProps,
} from './primitives/app-button/index.js';
export { AppText } from './primitives/app-text/index.js';
export type { AppTextVariant, AppTextProps } from './primitives/app-text/index.js';
export { Amount } from './primitives/amount/index.js';
export type { AmountSize, AmountProps } from './primitives/amount/index.js';
export { Chip } from './primitives/chip/index.js';
export type { ChipVariant, ChipProps } from './primitives/chip/index.js';
export { EstimateBadge } from './primitives/estimate-badge/index.js';
export type { EstimateBadgeProps } from './primitives/estimate-badge/index.js';
export { Field, TextField, Textarea, Select } from './primitives/field/index.js';
export type {
  FieldSize,
  FieldProps,
  TextFieldProps,
  TextareaProps,
  SelectProps,
} from './primitives/field/index.js';
export { MoneyField } from './primitives/money-field/index.js';
export type { MoneyFieldSize, MoneyFieldProps } from './primitives/money-field/index.js';
export { ProfilePicker } from './primitives/profile-picker/index.js';
export type { ProfileOption, ProfilePickerProps } from './primitives/profile-picker/index.js';
export { Checkbox, Switch } from './primitives/selection/index.js';
export type { CheckboxProps, SwitchProps } from './primitives/selection/index.js';
export { SegmentedControl } from './primitives/segmented-control/index.js';
export type {
  SegmentedOption,
  SegmentedControlProps,
} from './primitives/segmented-control/index.js';
export { HoldToConfirmButton } from './primitives/hold-to-confirm-button/index.js';
export type { HoldToConfirmButtonProps } from './primitives/hold-to-confirm-button/index.js';

// ── Data display ──────────────────────────────────────────────────────────────
export { BandLadder, BandSplitBar } from './data/band-ladder/index.js';
export type {
  BandRung,
  BandLadderProps,
  BandSegment,
  BandSplitBarProps,
} from './data/band-ladder/index.js';
export { OldVsNew, DeltaCallout } from './data/comparison/index.js';
export type { RegimeColumn, OldVsNewProps, DeltaCalloutProps } from './data/comparison/index.js';
export { StatTile, ReliefCard, ResultCard } from './data/cards/index.js';
export type {
  StatTileProps,
  ReliefCardProps,
  ResultRow,
  ResultCardProps,
} from './data/cards/index.js';
export { InflowsTable } from './data/inflows-table/index.js';
export type { InflowClass, InflowRow, InflowsTableProps } from './data/inflows-table/index.js';
export { Donut, BarCompare, EffectiveRateGauge } from './data/charts/index.js';
export type {
  DonutSegment,
  DonutProps,
  BarCompareProps,
  EffectiveRateGaugeProps,
} from './data/charts/index.js';
export { Stepper, ProgressBar, Ring } from './data/progress/index.js';
export type { Step, StepperProps, ProgressBarProps, RingProps } from './data/progress/index.js';
export { Skeleton, EmptyState, ErrorState } from './data/states/index.js';
export type { SkeletonProps, EmptyStateProps, ErrorStateProps } from './data/states/index.js';
export { Avatar } from './data/avatar/index.js';
export type { AvatarSize, AvatarProps } from './data/avatar/index.js';

// ── Overlay & feedback ──────────────────────────────────────────────────────────────
export { Modal, CriticalModal } from './overlay/modal/index.js';
export type { ModalProps, CriticalModalProps } from './overlay/modal/index.js';
export { Tooltip, Popover } from './overlay/tooltip/index.js';
export type { TooltipProps, PopoverProps } from './overlay/tooltip/index.js';
export { Toast, Banner, Callout } from './overlay/feedback/index.js';
export type {
  ToastTone,
  ToastProps,
  BannerTone,
  BannerProps,
  CalloutProps,
} from './overlay/feedback/index.js';
export { AssistCard, CitationBlock, MethodologyList, ExportRow, Disclaimer } from './overlay/cross/index.js';
export type {
  AssistCardProps,
  CitationBlockProps,
  MethodologyEntry,
  MethodologyListProps,
  ExportRowProps,
  DisclaimerProps,
} from './overlay/cross/index.js';
export { DrawerService, DrawerHost, ModalHost, ToastHost } from './overlay/drawer/index.js';
export type {
  DrawerServiceApi,
  ToastOptions,
  ShowModalOptions,
  ToastItem,
  ModalItem,
  ModalSize,
  DrawerState,
} from './overlay/drawer/index.js';

// ── Navigation ──────────────────────────────────────────────────────────────
export { TopBar, StepRail } from './navigation/nav/index.js';
export type { TopBarLink, TopBarProps, RailStep, StepRailProps } from './navigation/nav/index.js';

// Icons are NOT re-exported here. Import them via the dedicated proxy:
//   import { IconUpload } from '@icons';
// This keeps the icon source swappable in one file.
