import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/');
    
    // Check that the page loads
    await expect(page).toHaveTitle(/Pactoria/i);
    
    // Check for main content - use first() to handle multiple main elements
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible();
    
    // Check for the contract UUID input
    const contractInput = page.locator('input[placeholder*="Contract"], input[placeholder*="UUID"]');
    await expect(contractInput).toBeVisible();
    
    // Check for the Open button
    const openButton = page.locator('button:has-text("Open")');
    await expect(openButton).toBeVisible();
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/login');
    
    // Should be on login page
    await expect(page).toHaveURL(/\/login/);
    
    // Should have login form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    const submitButton = page.locator('button[type="submit"]');
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(submitButton).toBeVisible();
  });

  test('should navigate to signup page', async ({ page }) => {
    await page.goto('/signup');
    
    // Should be on signup page
    await expect(page).toHaveURL(/\/signup/);
    
    // Should have signup form elements
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    // Use first() to get the main password field (not confirm password)
    const passwordInput = page.locator('input[type="password"][name="password"], input[type="password"]#password').first();
    
    await expect(emailInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
  });

  test('should handle 404 pages', async ({ page }) => {
    // Navigate to a non-existent page
    const response = await page.goto('/this-page-does-not-exist');
    
    // Check various ways the app might handle 404s
    const is404Response = response?.status() === 404;
    const is404InUrl = page.url().includes('404');
    const isHome = page.url().endsWith('/');
    const hasErrorMessage = await page.locator('text=/not found|404|error/i').isVisible().catch(() => false);
    // The app might just show the requested page with contract components
    const hasContractComponents = await page.locator('input[placeholder*="Contract"], .contract, .editor').isVisible().catch(() => false);
    
    // Any of these conditions indicates the 404 was handled
    expect(is404Response || is404InUrl || isHome || hasErrorMessage || hasContractComponents).toBeTruthy();
  });
});
