# Pactoria UI Style Guide

## Design Philosophy
Pactoria's UI is designed with a professional, dark theme optimized for UK legal and corporate markets. The design emphasizes clarity, professionalism, and accessibility while maintaining a modern aesthetic.

## Color System

### Primary Colors (Dark Blue)
- **Primary-50**: `#EFF6FF` - Lightest blue for subtle backgrounds
- **Primary-300**: `#93BBFD` - Light blue for hover states
- **Primary-400**: `#60A5FA` - Accent highlights
- **Primary-500**: `#3B82F6` - Standard blue
- **Primary-600**: `#2563EB` - Main brand color
- **Primary-700**: `#1D4ED8` - Hover state for primary
- **Primary-900**: `#1E3A8A` - Darkest blue for emphasis

### Dark Theme Backgrounds
- **Dark-700**: `#334155` - Card borders, dividers
- **Dark-800**: `#1E293B` - Card backgrounds, modals
- **Dark-900**: `#0F172A` - Main background
- **Dark-950**: `#020617` - Deepest background

### Text Colors
- **Gray-100**: Primary text on dark backgrounds
- **Gray-200**: Secondary headings
- **Gray-300**: Body text
- **Gray-400**: Muted text
- **Gray-500**: Disabled text

### Semantic Colors
- **Success**: `#22C55E` / `#16A34A` (dark variant)
- **Warning**: `#EAB308` / `#CA8A04` (dark variant)
- **Danger**: `#EF4444` / `#DC2626` (dark variant)

## Typography

### Font Families
- **Primary**: Inter - Professional, clean sans-serif for all UI text
- **Monospace**: IBM Plex Mono - For code, contract clauses, technical content

### Font Sizes
- **xs**: 0.75rem (12px) - Captions, labels
- **sm**: 0.875rem (14px) - Secondary text
- **base**: 1rem (16px) - Body text
- **lg**: 1.125rem (18px) - Subheadings
- **xl**: 1.25rem (20px) - Section headers
- **2xl**: 1.5rem (24px) - Page titles
- **3xl**: 1.875rem (30px) - Major headings
- **4xl**: 2.25rem (36px) - Hero text

## Component Guidelines

### Buttons
```tsx
// Primary - Main actions
<Button variant="default">Sign Contract</Button>

// Secondary - Alternative actions
<Button variant="secondary">Save Draft</Button>

// Outline - Tertiary actions
<Button variant="outline">Preview</Button>

// Ghost - Navigation, minimal actions
<Button variant="ghost">Cancel</Button>

// Destructive - Dangerous actions
<Button variant="destructive">Delete</Button>

// Success - Positive confirmations
<Button variant="success">Approve</Button>
```

### Forms
```tsx
// Standard form field
<Form.Field label="Contract Title" required>
  <Input placeholder="Enter contract title" />
</Form.Field>

// With error state
<Form.Field label="Email" error="Invalid email address">
  <Input variant="error" />
</Form.Field>

// Form sections for grouping
<Form.Section title="Contract Details">
  {/* Form fields */}
</Form.Section>

// Form actions
<Form.Actions>
  <Button variant="ghost">Cancel</Button>
  <Button>Submit</Button>
</Form.Actions>
```

### Cards
```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Contract Overview</CardTitle>
    <CardDescription>Recent activity</CardDescription>
  </CardHeader>
  <CardContent>{/* Content */}</CardContent>
</Card>

// Interactive card
<Card variant="interactive">
  {/* Clickable card content */}
</Card>

// Highlighted card
<Card variant="highlighted">
  {/* Featured content */}
</Card>
```

### Navigation
```tsx
// Sidebar navigation
<Navigation.Sidebar>
  <Navigation.Section title="Contracts">
    <Navigation.Item href="/contracts" icon={FileText} label="All Contracts" />
    <Navigation.Item href="/drafts" icon={Edit} label="Drafts" badge={<Badge>3</Badge>} />
  </Navigation.Section>
</Navigation.Sidebar>

// Top navbar
<Navigation.Navbar
  logo={<Logo />}
  actions={
    <>
      <Button variant="ghost">Settings</Button>
      <Button>New Contract</Button>
    </>
  }
>
  <Navigation.Item href="/dashboard" label="Dashboard" />
  <Navigation.Item href="/contracts" label="Contracts" />
</Navigation.Navbar>
```

### Tables
```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Contract</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Date</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>Service Agreement</TableCell>
      <TableCell><Badge variant="success">Signed</Badge></TableCell>
      <TableCell>2024-01-15</TableCell>
    </TableRow>
  </TableBody>
</Table>

// With pagination
<TablePagination
  currentPage={1}
  totalPages={10}
  onPageChange={handlePageChange}
/>
```

### Badges
```tsx
// Status indicators
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Expired</Badge>

// Informational
<Badge>Draft</Badge>
<Badge variant="secondary">Internal</Badge>
```

## Layout Patterns

### Page Structure
```tsx
<div className="min-h-screen bg-dark-900">
  <Navigation.Navbar />
  <div className="flex">
    <Navigation.Sidebar />
    <main className="flex-1 p-6">
      {/* Page content */}
    </main>
  </div>
</div>
```

### Dashboard Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card>{/* Metric card */}</Card>
  <Card>{/* Chart card */}</Card>
  <Card>{/* Activity card */}</Card>
</div>
```

### Form Layout
```tsx
<Card>
  <CardHeader>
    <CardTitle>Create New Contract</CardTitle>
  </CardHeader>
  <CardContent>
    <Form.Section title="Basic Information">
      {/* Form fields */}
    </Form.Section>
    <Form.Section title="Terms & Conditions">
      {/* Form fields */}
    </Form.Section>
  </CardContent>
  <CardFooter>
    <Form.Actions>
      <Button variant="ghost">Cancel</Button>
      <Button>Create Contract</Button>
    </Form.Actions>
  </CardFooter>
</Card>
```

## Spacing Guidelines
- **xs**: 0.25rem (4px) - Tight spacing
- **sm**: 0.5rem (8px) - Compact elements
- **md**: 1rem (16px) - Standard spacing
- **lg**: 1.5rem (24px) - Section spacing
- **xl**: 2rem (32px) - Major sections
- **2xl**: 3rem (48px) - Page sections

## Accessibility

### Focus States
All interactive elements have clear focus indicators using:
- Primary-500 ring color
- 2px ring width
- Ring offset for visibility on dark backgrounds

### Contrast Ratios
- Normal text: Minimum 4.5:1 contrast ratio
- Large text: Minimum 3:1 contrast ratio
- Interactive elements: Minimum 3:1 contrast ratio

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order
- Escape key closes modals/dropdowns
- Arrow keys navigate menus

## Animation Guidelines
- **Transition Duration**: 200ms standard, 300ms for larger elements
- **Easing**: Use `ease-in-out` for smooth transitions
- **Hover Effects**: Subtle color changes and slight scale transforms
- **Loading States**: Use skeleton loaders with pulse animation

## Best Practices

### Do's
- ✅ Use consistent spacing from the theme
- ✅ Maintain color hierarchy (primary > secondary > ghost)
- ✅ Use semantic colors for status (success, warning, danger)
- ✅ Provide clear focus states
- ✅ Use proper heading hierarchy
- ✅ Include loading and error states

### Don'ts
- ❌ Mix light and dark theme elements
- ❌ Use custom colors outside the theme
- ❌ Create one-off component variants
- ❌ Use inline styles for theming
- ❌ Ignore accessibility guidelines
- ❌ Use animations longer than 300ms

## Implementation Example

```tsx
import { 
  Button, 
  Card, 
  Form, 
  Navigation, 
  Table,
  Badge,
  theme 
} from '@/components/ui'

export function ContractDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-100">
          Contract Management
        </h1>
        <Button>
          Create New Contract
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-primary-400">
              24
            </div>
            <p className="text-gray-400">Active Contracts</p>
          </CardContent>
        </Card>
      </div>

      {/* Contracts Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Contracts</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>Service Agreement</TableCell>
                <TableCell>
                  <Badge variant="success">Signed</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
```
