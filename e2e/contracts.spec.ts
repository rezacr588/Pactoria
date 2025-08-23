import { test, expect } from '@playwright/test'
import { setupAuth } from './helpers/auth'

test.describe('Contract Management', () => {
  test.beforeEach(async ({ page, context }) => {
    // Setup authentication
    await setupAuth(page, context)
    await page.goto('/dashboard')
  })

  test('should display contracts list', async ({ page }) => {
    // Mock contracts API
    await page.route('**/rest/v1/contracts**', async route => {
      await route.fulfill({
        status: 200,
        json: [
          {
            id: '1',
            title: 'Service Agreement',
            status: 'draft',
            created_at: '2024-01-20T10:00:00Z',
            updated_at: '2024-01-20T10:00:00Z',
            owner_id: 'user-1'
          },
          {
            id: '2',
            title: 'NDA Contract',
            status: 'signed',
            created_at: '2024-01-19T10:00:00Z',
            updated_at: '2024-01-19T10:00:00Z',
            owner_id: 'user-1'
          }
        ]
      })
    })

    await page.goto('/contracts')
    
    // Check for contract items
    await expect(page.locator('text=Service Agreement')).toBeVisible()
    await expect(page.locator('text=NDA Contract')).toBeVisible()
    
    // Check status badges
    await expect(page.locator('text=draft')).toBeVisible()
    await expect(page.locator('text=signed')).toBeVisible()
  })

  test('should create new contract', async ({ page }) => {
    await page.goto('/contracts')
    
    // Click new contract button
    await page.locator('button', { hasText: /new contract/i }).click()
    
    // Should navigate to create page
    await expect(page).toHaveURL(/\/contracts\/new/)
    
    // Fill contract form
    await page.fill('input[name="title"]', 'Test Contract')
    await page.fill('textarea[name="description"]', 'This is a test contract description')
    
    // Mock create contract API
    await page.route('**/rest/v1/contracts', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: {
            id: 'new-contract-id',
            title: 'Test Contract',
            description: 'This is a test contract description',
            status: 'draft',
            created_at: new Date().toISOString()
          }
        })
      }
    })
    
    // Submit form
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to contract detail page
    await expect(page).toHaveURL(/\/contracts\/new-contract-id/)
    await expect(page.locator('h1', { hasText: 'Test Contract' })).toBeVisible()
  })

  test('should edit existing contract', async ({ page }) => {
    // Mock contract detail API
    await page.route('**/rest/v1/contracts?id=eq.1**', async route => {
      await route.fulfill({
        status: 200,
        json: [{
          id: '1',
          title: 'Service Agreement',
          description: 'Original description',
          content: 'Contract content here',
          status: 'draft',
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z'
        }]
      })
    })

    await page.goto('/contracts/1')
    
    // Click edit button
    await page.locator('button', { hasText: /edit/i }).click()
    
    // Update title
    await page.fill('input[name="title"]', 'Updated Service Agreement')
    
    // Mock update API
    await page.route('**/rest/v1/contracts?id=eq.1', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          json: {
            id: '1',
            title: 'Updated Service Agreement',
            status: 'draft'
          }
        })
      }
    })
    
    // Save changes
    await page.locator('button', { hasText: /save/i }).click()
    
    // Check for success message
    await expect(page.locator('text=/saved|updated/i')).toBeVisible()
  })

  test('should change contract status', async ({ page }) => {
    // Mock contract detail
    await page.route('**/rest/v1/contracts?id=eq.1**', async route => {
      await route.fulfill({
        status: 200,
        json: [{
          id: '1',
          title: 'Service Agreement',
          status: 'draft',
          created_at: '2024-01-20T10:00:00Z'
        }]
      })
    })

    await page.goto('/contracts/1')
    
    // Open status dropdown
    await page.locator('button', { hasText: /status|draft/i }).click()
    
    // Select new status
    await page.locator('text=In Review').click()
    
    // Mock status update
    await page.route('**/rest/v1/contracts?id=eq.1', async route => {
      if (route.request().method() === 'PATCH') {
        await route.fulfill({
          status: 200,
          json: {
            id: '1',
            status: 'in_review'
          }
        })
      }
    })
    
    // Confirm status change
    await page.locator('button', { hasText: /confirm|update/i }).click()
    
    // Check for success
    await expect(page.locator('text=/status.*updated/i')).toBeVisible()
  })

  test('should delete contract', async ({ page }) => {
    // Mock contract detail
    await page.route('**/rest/v1/contracts?id=eq.1**', async route => {
      await route.fulfill({
        status: 200,
        json: [{
          id: '1',
          title: 'Service Agreement',
          status: 'draft'
        }]
      })
    })

    await page.goto('/contracts/1')
    
    // Click delete button
    await page.locator('button', { hasText: /delete/i }).click()
    
    // Confirm deletion in dialog
    await page.locator('button', { hasText: /confirm.*delete/i }).click()
    
    // Mock delete API
    await page.route('**/rest/v1/contracts?id=eq.1', async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 204 })
      }
    })
    
    // Should redirect to contracts list
    await expect(page).toHaveURL(/\/contracts/)
    await expect(page.locator('text=/deleted.*successfully/i')).toBeVisible()
  })

  test('should add collaborator to contract', async ({ page }) => {
    // Mock contract and collaborators
    await page.route('**/rest/v1/contracts?id=eq.1**', async route => {
      await route.fulfill({
        status: 200,
        json: [{
          id: '1',
          title: 'Service Agreement',
          status: 'draft',
          collaborators: []
        }]
      })
    })

    await page.goto('/contracts/1')
    
    // Open collaborators section
    await page.locator('button', { hasText: /collaborators|share/i }).click()
    
    // Add collaborator email
    await page.fill('input[placeholder*="email"]', 'collaborator@example.com')
    
    // Select role
    await page.locator('select[name="role"]').selectOption('viewer')
    
    // Mock add collaborator API
    await page.route('**/rest/v1/contract_collaborators', async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          json: {
            id: 'collab-1',
            contract_id: '1',
            user_id: 'user-2',
            role: 'viewer'
          }
        })
      }
    })
    
    // Add collaborator
    await page.locator('button', { hasText: /add|invite/i }).click()
    
    // Check for success
    await expect(page.locator('text=/added.*collaborator/i')).toBeVisible()
    await expect(page.locator('text=collaborator@example.com')).toBeVisible()
  })

  test('should export contract', async ({ page }) => {
    // Mock contract detail
    await page.route('**/rest/v1/contracts?id=eq.1**', async route => {
      await route.fulfill({
        status: 200,
        json: [{
          id: '1',
          title: 'Service Agreement',
          content: 'Contract content here',
          status: 'signed'
        }]
      })
    })

    await page.goto('/contracts/1')
    
    // Open export menu
    await page.locator('button', { hasText: /export/i }).click()
    
    // Start download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Select PDF export
    await page.locator('text=Export as PDF').click()
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify download
    expect(download.suggestedFilename()).toContain('Service Agreement')
    expect(download.suggestedFilename()).toMatch(/\.pdf$/)
  })

  test('should filter contracts by status', async ({ page }) => {
    // Mock contracts with different statuses
    await page.route('**/rest/v1/contracts**', async route => {
      const url = new URL(route.request().url())
      const status = url.searchParams.get('status')
      
      let contracts = [
        { id: '1', title: 'Draft Contract', status: 'draft' },
        { id: '2', title: 'Signed Contract', status: 'signed' },
        { id: '3', title: 'Review Contract', status: 'in_review' }
      ]
      
      if (status) {
        contracts = contracts.filter(c => c.status === status.replace('eq.', ''))
      }
      
      await route.fulfill({
        status: 200,
        json: contracts
      })
    })

    await page.goto('/contracts')
    
    // Open filter dropdown
    await page.locator('button', { hasText: /filter/i }).click()
    
    // Select draft status
    await page.locator('input[value="draft"]').check()
    
    // Apply filter
    await page.locator('button', { hasText: /apply/i }).click()
    
    // Should only show draft contracts
    await expect(page.locator('text=Draft Contract')).toBeVisible()
    await expect(page.locator('text=Signed Contract')).not.toBeVisible()
    await expect(page.locator('text=Review Contract')).not.toBeVisible()
  })

  test('should search contracts', async ({ page }) => {
    await page.goto('/contracts')
    
    // Type in search box
    await page.fill('input[placeholder*="search"]', 'Service')
    
    // Mock search API
    await page.route('**/rest/v1/contracts?title=ilike.*Service**', async route => {
      await route.fulfill({
        status: 200,
        json: [{
          id: '1',
          title: 'Service Agreement',
          status: 'draft'
        }]
      })
    })
    
    // Trigger search
    await page.press('input[placeholder*="search"]', 'Enter')
    
    // Should show search results
    await expect(page.locator('text=Service Agreement')).toBeVisible()
  })
})
