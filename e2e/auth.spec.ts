import { test, expect } from '@playwright/test'

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display login form', async ({ page }) => {
    // Check for login elements
    await expect(page.locator('h1', { hasText: 'Sign in' })).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for invalid inputs', async ({ page }) => {
    // Submit empty form
    await page.locator('button[type="submit"]').click()
    
    // Check for validation messages
    await expect(page.locator('text=/email.*required/i')).toBeVisible()
    await expect(page.locator('text=/password.*required/i')).toBeVisible()
  })

  test('should show error for invalid email format', async ({ page }) => {
    // Enter invalid email
    await page.fill('input[type="email"]', 'invalid-email')
    await page.fill('input[type="password"]', 'password123')
    await page.locator('button[type="submit"]').click()
    
    // Check for email validation error
    await expect(page.locator('text=/invalid.*email/i')).toBeVisible()
  })

  test('should navigate to signup page', async ({ page }) => {
    // Click on signup link
    await page.locator('text=/sign up/i').click()
    
    // Check we're on signup page
    await expect(page).toHaveURL(/\/signup/)
    await expect(page.locator('h1', { hasText: 'Create an account' })).toBeVisible()
  })

  test('should handle successful login', async ({ page }) => {
    // Mock successful login
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          access_token: 'mock-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'mock-refresh-token',
          user: {
            id: 'mock-user-id',
            email: 'test@example.com',
            user_metadata: { name: 'Test User' }
          }
        }
      })
    })

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'password123')
    await page.locator('button[type="submit"]').click()
    
    // Should redirect to dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should handle login error', async ({ page }) => {
    // Mock failed login
    await page.route('**/auth/v1/token**', async route => {
      await route.fulfill({
        status: 400,
        json: {
          error: 'invalid_grant',
          error_description: 'Invalid login credentials'
        }
      })
    })

    // Fill login form
    await page.fill('input[type="email"]', 'test@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()
    
    // Should show error message
    await expect(page.locator('text=/invalid.*credentials/i')).toBeVisible()
  })

  test('should handle signup flow', async ({ page }) => {
    // Navigate to signup
    await page.goto('/signup')
    
    // Mock successful signup
    await page.route('**/auth/v1/signup**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'mock-user-id',
          email: 'newuser@example.com',
          user_metadata: { name: 'New User' }
        }
      })
    })

    // Fill signup form
    await page.fill('input[placeholder*="Name"]', 'New User')
    await page.fill('input[type="email"]', 'newuser@example.com')
    await page.fill('input[type="password"]', 'SecurePassword123!')
    await page.locator('button[type="submit"]').click()
    
    // Should show success message or redirect
    await expect(page.locator('text=/check.*email|verification|confirm/i')).toBeVisible()
  })

  test('should handle logout', async ({ page, context }) => {
    // Set mock auth cookie
    await context.addCookies([{
      name: 'sb-auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }])

    // Navigate to dashboard
    await page.goto('/dashboard')
    
    // Mock logout
    await page.route('**/auth/v1/logout**', async route => {
      await route.fulfill({ status: 204 })
    })

    // Click logout button
    await page.locator('button', { hasText: /logout|sign out/i }).click()
    
    // Should redirect to login
    await expect(page).toHaveURL('/')
  })

  test('should persist session across page reloads', async ({ page, context }) => {
    // Set mock auth cookie
    await context.addCookies([{
      name: 'sb-auth-token',
      value: 'mock-token',
      domain: 'localhost',
      path: '/'
    }])

    // Mock session check
    await page.route('**/auth/v1/user**', async route => {
      await route.fulfill({
        status: 200,
        json: {
          id: 'mock-user-id',
          email: 'test@example.com',
          user_metadata: { name: 'Test User' }
        }
      })
    })

    // Navigate to dashboard
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/dashboard/)
    
    // Reload page
    await page.reload()
    
    // Should still be on dashboard
    await expect(page).toHaveURL(/\/dashboard/)
  })

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Try to access protected route without auth
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL('/')
    await expect(page.locator('h1', { hasText: 'Sign in' })).toBeVisible()
  })
})
