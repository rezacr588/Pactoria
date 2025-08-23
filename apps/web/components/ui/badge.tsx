import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center font-medium rounded-full transition-all duration-200 border",
  {
    variants: {
      variant: {
        default:
          "bg-primary-100 text-primary-700 border-primary-200 hover:bg-primary-200",
        primary:
          "bg-primary-600 text-white border-transparent hover:bg-primary-700",
        secondary:
          "bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200",
        success:
          "bg-green-100 text-green-700 border-green-200 hover:bg-green-200",
        warning:
          "bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200",
        danger:
          "bg-red-100 text-red-700 border-red-200 hover:bg-red-200",
        outline:
          "text-slate-700 border-slate-300 hover:bg-slate-100",
      },
      size: {
        default: "px-3 py-1 text-sm",
        sm: "px-2 py-0.5 text-xs",
        lg: "px-4 py-1.5 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant, size }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
