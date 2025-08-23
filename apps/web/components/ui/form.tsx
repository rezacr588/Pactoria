import * as React from "react"
import { cn } from "@/lib/utils"
import { Label } from "./label"

interface FormFieldProps {
  label?: string
  error?: string
  helper?: string
  required?: boolean
  children: React.ReactNode
  className?: string
}

export function FormField({
  label,
  error,
  helper,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn("space-y-1 mb-4", className)}>
      {label && (
        <Label variant={error ? "error" : "default"}>
          {label}
          {required && <span className="text-danger-400 ml-1">*</span>}
        </Label>
      )}
      {children}
      {helper && !error && (
        <p className="text-sm text-gray-500 mt-1">{helper}</p>
      )}
      {error && (
        <p className="text-sm text-danger-400 mt-1">{error}</p>
      )}
    </div>
  )
}

interface FormSectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  className?: string
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {(title || description) && (
        <div className="border-b border-dark-700 pb-4">
          {title && (
            <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-gray-400 mt-1">{description}</p>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

interface FormActionsProps {
  children: React.ReactNode
  className?: string
  align?: "left" | "center" | "right"
}

export function FormActions({
  children,
  className,
  align = "right",
}: FormActionsProps) {
  const alignmentClasses = {
    left: "justify-start",
    center: "justify-center",
    right: "justify-end",
  }

  return (
    <div
      className={cn(
        "flex gap-3 pt-4 border-t border-dark-700",
        alignmentClasses[align],
        className
      )}
    >
      {children}
    </div>
  )
}

export const Form = {
  Field: FormField,
  Section: FormSection,
  Actions: FormActions,
}
