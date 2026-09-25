import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border border-transparent px-2.5 py-1 text-xs font-medium',
  {
    variants: {
      variant: {
        default: 'bg-[#eef7dd] text-[#5f9018]',
        outline: 'border-border bg-card text-muted-foreground',
        success: 'bg-[#e7f5d4] text-[#4d7f12]',
        warning: 'bg-[#fdf3d3] text-[#9c7a1a]',
        critical: 'bg-[#fbe9e7] text-[#c0392b]',
        neutral: 'bg-[#eef1ec] text-[#6b726b]',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(({ className, variant, ...props }, ref) => (
  <span ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = 'Badge';

export { badgeVariants };