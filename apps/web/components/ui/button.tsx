import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md focus-visible:ring-primary-500",
        primary: "bg-primary-600 text-white hover:bg-primary-700 shadow-sm hover:shadow-md focus-visible:ring-primary-500",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 border border-slate-200 focus-visible:ring-slate-500",
        outline: "border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-primary-500",
        ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-slate-500",
        destructive: "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500",
        success: "bg-green-600 text-white hover:bg-green-700 focus-visible:ring-green-500",
        link: "text-primary-600 underline-offset-4 hover:underline hover:text-primary-700",
      },
      size: {
        default: "h-10 px-4 py-2 text-base rounded-md",
        sm: "h-8 px-3 text-sm rounded-md",
        lg: "h-12 px-6 text-lg rounded-lg",
        xl: "h-14 px-8 text-xl rounded-lg",
        icon: "h-10 w-10 rounded-md",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
