import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  description?: string
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  className?: string
  loading?: boolean
}

export function StatsCard({
  title,
  value,
  description,
  change,
  changeLabel,
  icon,
  trend,
  className,
  loading = false
}: StatsCardProps) {
  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-4 w-4" />
    if (trend === 'down') return <TrendingDown className="h-4 w-4" />
    return <Minus className="h-4 w-4" />
  }

  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600'
    if (trend === 'down') return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-8 animate-pulse rounded bg-gray-200" />
        </CardHeader>
        <CardContent>
          <div className="h-8 w-20 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon && (
          <div className="text-muted-foreground">
            {icon}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {(description || change !== undefined) && (
          <div className="mt-1 flex items-center gap-2 text-xs">
            {change !== undefined && (
              <span className={cn("flex items-center gap-1", getTrendColor())}>
                {getTrendIcon()}
                <span>{change > 0 ? '+' : ''}{change}%</span>
              </span>
            )}
            {changeLabel && (
              <span className="text-muted-foreground">{changeLabel}</span>
            )}
            {description && !changeLabel && (
              <span className="text-muted-foreground">{description}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface MetricCardProps {
  title: string
  metric: string | number
  subtitle?: string
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray'
  className?: string
  loading?: boolean
}

const colorClasses = {
  blue: 'bg-blue-100 text-blue-600',
  green: 'bg-green-100 text-green-600',
  yellow: 'bg-yellow-100 text-yellow-600',
  red: 'bg-red-100 text-red-600',
  purple: 'bg-purple-100 text-purple-600',
  gray: 'bg-gray-100 text-gray-600',
}

export function MetricCard({
  title,
  metric,
  subtitle,
  icon,
  color = 'blue',
  className,
  loading = false
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn("border-0 shadow-sm", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
              <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-20 animate-pulse rounded bg-gray-200" />
            </div>
            <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("border-0 shadow-sm", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{metric}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          {icon && (
            <div className={cn(
              "flex h-12 w-12 items-center justify-center rounded-lg",
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
