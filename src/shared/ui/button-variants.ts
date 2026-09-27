import { cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg font-medium whitespace-nowrap transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-primary-600 text-white shadow-md hover:bg-primary-700 hover:shadow-lg focus-visible:ring-primary-500',
        secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus-visible:ring-secondary-500',
        outline:
          'border-2 border-primary-600 text-primary-600 hover:bg-primary-600 hover:text-white focus-visible:ring-primary-500',
        subtle:
          'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50 focus-visible:ring-neutral-300',
        ghost: 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-300',
        danger: 'bg-error-600 text-white hover:bg-error-700 focus-visible:ring-error-500',
        success: 'bg-success-600 text-white hover:bg-success-700 focus-visible:ring-success-500',
        link: 'text-primary-600 underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-5',
        lg: 'h-13 px-8 text-lg',
        icon: 'size-10',
        'icon-sm': 'size-8',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);
