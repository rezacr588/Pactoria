/**
 * Pactoria Unified Theme System
 * Professional dark theme with dark blue accent colors
 * Designed for UK legal/corporate market
 */

export const theme = {
  // Brand Colors
  colors: {
    // Primary - Professional Dark Blue
    primary: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93BBFD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A',
      950: '#172554',
    },
    // Dark backgrounds
    dark: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      300: '#CBD5E1',
      400: '#94A3B8',
      500: '#64748B',
      600: '#475569',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    // Semantic colors
    success: {
      light: '#4ADE80',
      DEFAULT: '#22C55E',
      dark: '#16A34A',
    },
    warning: {
      light: '#FCD34D',
      DEFAULT: '#EAB308',
      dark: '#CA8A04',
    },
    danger: {
      light: '#F87171',
      DEFAULT: '#EF4444',
      dark: '#DC2626',
    },
    info: {
      light: '#60A5FA',
      DEFAULT: '#3B82F6',
      dark: '#2563EB',
    },
  },

  // Typography
  typography: {
    fonts: {
      sans: 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      mono: 'IBM Plex Mono, Monaco, Consolas, monospace',
    },
    sizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    weights: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Spacing
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Border Radius
  radius: {
    none: '0',
    sm: '0.25rem',
    DEFAULT: '0.5rem',
    md: '0.625rem',
    lg: '0.75rem',
    xl: '1rem',
    full: '9999px',
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    dark: '0 2px 12px rgba(0, 0, 0, 0.25)',
    'dark-lg': '0 10px 40px rgba(0, 0, 0, 0.35)',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    DEFAULT: '200ms',
    slow: '300ms',
  },

  // Z-index layers
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
}

// Component Variants
export const componentVariants = {
  button: {
    // Base styles
    base: 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-dark-900 disabled:opacity-50 disabled:cursor-not-allowed',
    
    // Variants
    variants: {
      primary: 'bg-primary-600 text-white hover:bg-primary-700 focus-visible:ring-primary-500 shadow-md hover:shadow-lg',
      secondary: 'bg-dark-700 text-gray-100 hover:bg-dark-600 focus-visible:ring-dark-500 border border-dark-600',
      outline: 'border border-primary-600 text-primary-400 hover:bg-primary-900/20 focus-visible:ring-primary-500',
      ghost: 'text-gray-300 hover:bg-dark-800 hover:text-gray-100 focus-visible:ring-dark-500',
      danger: 'bg-danger-dark text-white hover:bg-danger-DEFAULT focus-visible:ring-danger-DEFAULT',
      success: 'bg-success-dark text-white hover:bg-success-DEFAULT focus-visible:ring-success-DEFAULT',
    },
    
    // Sizes
    sizes: {
      sm: 'h-8 px-3 text-sm rounded-md',
      md: 'h-10 px-4 text-base rounded-md',
      lg: 'h-12 px-6 text-lg rounded-lg',
      xl: 'h-14 px-8 text-xl rounded-lg',
    },
  },

  input: {
    base: 'w-full bg-dark-800 border border-dark-700 text-gray-100 placeholder-gray-500 rounded-md transition-all duration-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed',
    sizes: {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-base',
      lg: 'h-12 px-4 text-lg',
    },
    error: 'border-danger-DEFAULT focus:border-danger-DEFAULT focus:ring-danger-DEFAULT/20',
  },

  card: {
    base: 'bg-dark-800 border border-dark-700 rounded-lg shadow-dark transition-all duration-200',
    interactive: 'hover:border-primary-700 hover:shadow-dark-lg cursor-pointer',
    padded: 'p-6',
  },

  badge: {
    base: 'inline-flex items-center font-medium rounded-full transition-colors',
    variants: {
      primary: 'bg-primary-900/30 text-primary-300 border border-primary-700/50',
      secondary: 'bg-dark-700 text-gray-300 border border-dark-600',
      success: 'bg-success-dark/20 text-success-light border border-success-dark/50',
      warning: 'bg-warning-dark/20 text-warning-light border border-warning-dark/50',
      danger: 'bg-danger-dark/20 text-danger-light border border-danger-dark/50',
    },
    sizes: {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-3 py-1 text-sm',
      lg: 'px-4 py-1.5 text-base',
    },
  },

  modal: {
    overlay: 'fixed inset-0 bg-black/60 backdrop-blur-sm z-50',
    content: 'bg-dark-800 border border-dark-700 rounded-lg shadow-dark-lg',
    header: 'border-b border-dark-700 px-6 py-4',
    body: 'px-6 py-4',
    footer: 'border-t border-dark-700 px-6 py-4 flex justify-end gap-3',
  },

  dropdown: {
    menu: 'bg-dark-800 border border-dark-700 rounded-lg shadow-dark-lg py-1',
    item: 'px-4 py-2 text-gray-300 hover:bg-dark-700 hover:text-gray-100 transition-colors cursor-pointer',
    separator: 'my-1 border-t border-dark-700',
  },

  table: {
    wrapper: 'w-full overflow-auto',
    base: 'w-full bg-dark-800 border border-dark-700 rounded-lg',
    header: 'bg-dark-900 border-b border-dark-700',
    headerCell: 'px-4 py-3 text-left text-gray-200 font-semibold',
    body: 'divide-y divide-dark-700',
    row: 'hover:bg-dark-700/50 transition-colors',
    cell: 'px-4 py-3 text-gray-300',
  },

  form: {
    label: 'block text-sm font-medium text-gray-200 mb-1',
    helper: 'text-sm text-gray-500 mt-1',
    error: 'text-sm text-danger-light mt-1',
    group: 'space-y-1 mb-4',
  },

  navigation: {
    item: 'px-3 py-2 rounded-md text-gray-300 hover:bg-dark-800 hover:text-gray-100 transition-all duration-200',
    active: 'bg-primary-900/30 text-primary-300 border-l-2 border-primary-500',
  },

  alert: {
    base: 'rounded-lg px-4 py-3 flex items-start gap-3',
    variants: {
      info: 'bg-primary-900/20 text-primary-300 border border-primary-700/50',
      success: 'bg-success-dark/20 text-success-light border border-success-dark/50',
      warning: 'bg-warning-dark/20 text-warning-light border border-warning-dark/50',
      danger: 'bg-danger-dark/20 text-danger-light border border-danger-dark/50',
    },
  },

  tabs: {
    list: 'flex border-b border-dark-700',
    trigger: 'px-4 py-2 text-gray-400 hover:text-gray-200 transition-colors relative',
    activeTrigger: 'text-primary-400 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-500',
    content: 'pt-4',
  },

  skeleton: {
    base: 'bg-dark-700 animate-pulse rounded',
    text: 'h-4 w-full',
    title: 'h-6 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-lg',
  },

  tooltip: {
    base: 'bg-dark-950 text-gray-100 px-2 py-1 rounded text-sm shadow-dark-lg border border-dark-700',
    arrow: 'fill-dark-950',
  },
}

// Utility function to combine class names
export function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

// Export theme CSS variables for use in global CSS
export const themeCSS = `
  :root {
    --primary-50: ${theme.colors.primary[50]};
    --primary-100: ${theme.colors.primary[100]};
    --primary-200: ${theme.colors.primary[200]};
    --primary-300: ${theme.colors.primary[300]};
    --primary-400: ${theme.colors.primary[400]};
    --primary-500: ${theme.colors.primary[500]};
    --primary-600: ${theme.colors.primary[600]};
    --primary-700: ${theme.colors.primary[700]};
    --primary-800: ${theme.colors.primary[800]};
    --primary-900: ${theme.colors.primary[900]};
    --primary-950: ${theme.colors.primary[950]};
    
    --dark-50: ${theme.colors.dark[50]};
    --dark-100: ${theme.colors.dark[100]};
    --dark-200: ${theme.colors.dark[200]};
    --dark-300: ${theme.colors.dark[300]};
    --dark-400: ${theme.colors.dark[400]};
    --dark-500: ${theme.colors.dark[500]};
    --dark-600: ${theme.colors.dark[600]};
    --dark-700: ${theme.colors.dark[700]};
    --dark-800: ${theme.colors.dark[800]};
    --dark-900: ${theme.colors.dark[900]};
    --dark-950: ${theme.colors.dark[950]};
  }
`
