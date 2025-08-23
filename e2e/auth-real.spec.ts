import { test, expect } from '@playwright/test'
import { randomEmail, randomPassword } from './helpers/random'

test.describe('Authentication - Real Tests', () => {
  const testEmail = randomEmail()
  const testPassword = randomPassword()

  test('should show login page', async ({ page }) => {
    await page.goto('/')
    
    // Check for login form elements
    await expect(page.locator('h1').first()).toBeVisible()
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should handle signup flow', async ({ page }) => {
    await page.goto('/signup')
    
    // Fill signup form
    await page.fill('input[type="email"]', testEmail)
    await page.fill('input[type="password"]', testPassword)
    
    // Submit form
    await page.locator('button[type="submit"]').click()
    
    // Should either redirect to dashboard or show email verification message
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 }).catch(() => {
      // If no redirect, check for verification message
      return expect(page.locator('text=/verify|check.*email|confirm/i')).toBeVisible({ timeout: 5000 })
    })
  })

  test('should handle login with invalid credentials', async ({ page }) => {
    await page.goto('/')
    
    // Try to login with invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.locator('button[type="submit"]').click()
    
    // Should show error message
    await expect(page.locator('text=/invalid|incorrect|error/i').first()).toBeVisible({ timeout: 5000 })
  })

  test('should validate email format', async ({ page }) => {
    await page.goto('/')
    
    // Enter invalid email format
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', 'password123')
    
    // Try to submit
    await page.locator('button[type="submit"]').click()
    
    // Should show validation error
    const emailInput = page.locator('input[type="email"]')
    const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid)
    expect(isInvalid).toBeTruthy()
  })

  test('should navigate between login and signup', async ({ page }) => {
    await page.goto('/')
    
    // Click on signup link
    const signupLink = page.locator('a[href="/signup"], button:has-text("Sign up")')
    if (await signupLink.isVisible()) {
      await signupLink.click()
      await expect(page).toHaveURL(/\/signup/)
    }
    
    // Navigate back to login
    const loginLink = page.locator('a[href="/"], a[href="/login"], button:has-text("Sign in")')
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/\/(login|$)/)
    }
  })

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access dashboard without authentication
    await page.goto('/dashboard')
    
    // Should redirect to login
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 5000 })
  })

  test('should handle password requirements', async ({ page }) => {
    await page.goto('/signup')
    
    // Try weak password
    await page.fill('input[type="email"]', randomEmail())
    await page.fill('input[type="password"]', '123') // Too short
    
    // Try to submit
    await page.locator('button[type="submit"]').click()
    
    // Should show password requirements error
    await expect(page.locator('text=/password.*must|weak|short|characters/i').first()).toBeVisible({ timeout: 5000 })
  })
})
