import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { ChevronRight, LucideIcon } from "lucide-react"

interface NavItemProps {
  href: string
  label: string
  icon?: LucideIcon
  badge?: React.ReactNode
  children?: NavItemProps[]
  className?: string
}

export function NavItem({
  href,
  label,
  icon: Icon,
  badge,
  children,
  className,
}: NavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(`${href}/`)
  const [isExpanded, setIsExpanded] = React.useState(isActive)

  const baseClasses = "flex items-center gap-3 px-3 py-2 rounded-md transition-all duration-200"
  const activeClasses = "bg-primary-900/30 text-primary-300 border-l-2 border-primary-500 font-medium"
  const inactiveClasses = "text-gray-300 hover:bg-dark-800 hover:text-gray-100"

  if (children && children.length > 0) {
    return (
      <div className={className}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className={cn(
            baseClasses,
            "w-full justify-between",
            isActive ? activeClasses : inactiveClasses
          )}
        >
          <div className="flex items-center gap-3">
            {Icon && <Icon className="h-5 w-5" />}
            <span>{label}</span>
          </div>
          <ChevronRight
            className={cn(
              "h-4 w-4 transition-transform",
              isExpanded && "rotate-90"
            )}
          />
        </button>
        {isExpanded && (
          <div className="ml-6 mt-1 space-y-1">
            {children.map((child) => (
              <NavItem key={child.href} {...child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <Link
      href={href}
      className={cn(
        baseClasses,
        isActive ? activeClasses : inactiveClasses,
        className
      )}
    >
      {Icon && <Icon className="h-5 w-5" />}
      <span className="flex-1">{label}</span>
      {badge}
    </Link>
  )
}

interface NavSectionProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function NavSection({ title, children, className }: NavSectionProps) {
  return (
    <div className={cn("space-y-1", className)}>
      {title && (
        <h3 className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          {title}
        </h3>
      )}
      {children}
    </div>
  )
}

interface NavbarProps {
  logo?: React.ReactNode
  children?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function Navbar({ logo, children, actions, className }: NavbarProps) {
  return (
    <nav className={cn(
      "fixed top-0 w-full bg-dark-900/90 backdrop-blur-md z-50 border-b border-dark-700",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            {logo && <div className="flex-shrink-0">{logo}</div>}
            {children && (
              <div className="hidden md:flex items-center space-x-4">
                {children}
              </div>
            )}
          </div>
          {actions && (
            <div className="flex items-center gap-4">
              {actions}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

interface SidebarProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function Sidebar({ children, className, header, footer }: SidebarProps) {
  return (
    <aside className={cn(
      "flex flex-col h-full bg-dark-800 border-r border-dark-700 w-64",
      className
    )}>
      {header && (
        <div className="p-4 border-b border-dark-700">
          {header}
        </div>
      )}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {children}
      </div>
      {footer && (
        <div className="p-4 border-t border-dark-700">
          {footer}
        </div>
      )}
    </aside>
  )
}

export const Navigation = {
  Item: NavItem,
  Section: NavSection,
  Navbar,
  Sidebar,
}
