import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/26-avatars-pills.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.avatar · :376-380)
 *
 * The only avatar in the product is the AI assistant mark — a serif "T" on a
 * clay gradient. Calm, never a cartoon face.
 */
export type AvatarSize = 'sm' | 'md' | 'lg';

export interface AvatarProps {
  /** The glyph or initial. Defaults to the TaxLens "T". */
  readonly children?: string;
  readonly size?: AvatarSize;
  readonly className?: string;
}

const SIZE: Record<AvatarSize, string> = {
  sm: 'h-[30px] w-[30px] text-[13px]',
  md: 'h-10 w-10 text-base',
  lg: 'h-14 w-14 text-[22px]',
};

export function Avatar({ children = 'T', size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-grid flex-shrink-0 place-items-center rounded-full font-serif font-semibold text-white',
        'bg-[linear-gradient(135deg,#D89E7E,#8E4022)]',
        SIZE[size],
        className,
      )}
      aria-hidden="true"
    >
      {children}
    </span>
  );
}
