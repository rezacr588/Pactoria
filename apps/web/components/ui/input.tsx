import * as React from "react"
import { cn } from "@/lib/utils"
import { cva, type VariantProps } from "class-variance-authority"

const inputVariants = cva(
  "flex w-full bg-white border text-slate-900 placeholder-slate-400 transition-all duration-200 file:border-0 file:bg-transparent file:text-sm file:font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:cursor-not-allowed disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-slate-300 focus:border-primary-500",
        error: "border-red-500 focus:border-red-500 focus:ring-red-500/20",
        success: "border-green-500 focus:border-green-500 focus:ring-green-500/20",
      },
      size: {
        default: "h-10 px-4 text-base rounded-md",
        sm: "h-8 px-3 text-sm rounded-md",
        lg: "h-12 px-4 text-lg rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(inputVariants({ variant, size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input, inputVariants }
