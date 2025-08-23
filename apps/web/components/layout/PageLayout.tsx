import React from 'react'
import { cn } from '@/lib/utils'

interface PageLayoutProps {
  children: React.ReactNode
  className?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '7xl' | 'full'
}

const maxWidthClasses = {
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  '7xl': 'max-w-7xl',
  full: 'max-w-full',
}

export function PageLayout({ 
  children, 
  className,
  maxWidth = '7xl'
}: PageLayoutProps) {
  return (
    <div className={cn(
      'mx-auto px-4 py-6 sm:px-6 lg:px-8',
      maxWidthClasses[maxWidth],
      className
    )}>
      {children}
    </div>
  )
}

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  breadcrumbs?: React.ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  description, 
  actions,
  breadcrumbs,
  className 
}: PageHeaderProps) {
  return (
    <div className={cn("space-y-4 pb-6", className)}>
      {breadcrumbs && (
        <div className="text-sm text-muted-foreground">
          {breadcrumbs}
        </div>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
          {description && (
            <p className="text-muted-foreground">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}

interface PageSectionProps {
  children: React.ReactNode
  className?: string
}

export function PageSection({ children, className }: PageSectionProps) {
  return (
    <div className={cn("space-y-6", className)}>
      {children}
    </div>
  )
}
