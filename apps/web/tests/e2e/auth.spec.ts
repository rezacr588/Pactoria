import { test, expect } from './fixtures';

test.describe('Authentication', () => {
  test.describe('Login Flow', () => {
    test('should login with valid credentials', async ({ page, auth }) => {
      const testUser = auth.getTestUser();
      
      await page.goto('/login');
      
      // Check that we're on the login page
      await expect(page).toHaveURL('/login');
      await expect(page.locator('h1, h2').first()).toContainText(/sign in|login/i);
      
      // Fill in login form
      await page.fill('input[name="email"], input[type="email"]', testUser.email);
      await page.fill('input[name="password"], input[type="password"]', testUser.password);
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should redirect to home page after successful login
      await page.waitForURL('/', { timeout: 10000 });
      
      // Verify user is logged in (check for user menu or dashboard elements)
      const userIndicator = page.locator('[data-testid="user-menu"], [data-testid="user-avatar"], .user-menu');
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should show error with invalid credentials', async ({ page }) => {
      await page.goto('/login');
      
      // Fill in invalid credentials
      await page.fill('input[name="email"], input[type="email"]', 'invalid@example.com');
      await page.fill('input[name="password"], input[type="password"]', 'wrongpassword');
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should stay on login page
      await expect(page).toHaveURL('/login');
      
      // Should show error message
      const errorMessage = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/invalid|incorrect|wrong|failed/i);
    });

    test('should handle empty form submission', async ({ page }) => {
      await page.goto('/login');
      
      // Try to submit empty form
      await page.click('button[type="submit"]');
      
      // Should show validation errors
      const validationErrors = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      await expect(validationErrors.first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to signup page', async ({ page }) => {
      await page.goto('/login');
      
      // Click on signup link
      const signupLink = page.locator('a[href="/signup"], a:has-text("Sign up"), a:has-text("Create account")');
      await signupLink.click();
      
      // Should navigate to signup page
      await page.waitForURL('/signup');
      await expect(page.locator('h1, h2').first()).toContainText(/sign up|create|register/i);
    });

    test('should navigate to password reset', async ({ page }) => {
      await page.goto('/login');
      
      // Click on forgot password link
      const forgotLink = page.locator('a:has-text("Forgot"), a:has-text("Reset")');
      if (await forgotLink.isVisible()) {
        await forgotLink.click();
        
        // Should show password reset form or navigate to reset page
        const resetForm = page.locator('input[name="email"], input[placeholder*="email"]');
        await expect(resetForm).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Signup Flow', () => {
    test('should create new account', async ({ page }) => {
      const timestamp = Date.now();
      const newUser = {
        email: `test${timestamp}@example.com`,
        password: 'Test123456!',
      };
      
      await page.goto('/signup');
      
      // Fill in signup form
      await page.fill('input[name="email"], input[type="email"]', newUser.email);
      await page.fill('input[name="password"], input[type="password"]', newUser.password);
      
      // Handle password confirmation if present
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm"], input[placeholder*="Confirm"]');
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill(newUser.password);
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should either redirect to home or show success message
      await page.waitForURL((url) => url.pathname === '/' || url.pathname === '/verify-email', {
        timeout: 10000,
      });
    });

    test('should show error for duplicate email', async ({ page, auth }) => {
      const existingUser = auth.getTestUser();
      
      await page.goto('/signup');
      
      // Try to sign up with existing email
      await page.fill('input[name="email"], input[type="email"]', existingUser.email);
      await page.fill('input[name="password"], input[type="password"]', 'Test123456!');
      
      // Handle password confirmation if present
      const confirmPasswordField = page.locator('input[name="confirmPassword"], input[name="confirm"]');
      if (await confirmPasswordField.isVisible()) {
        await confirmPasswordField.fill('Test123456!');
      }
      
      // Submit form
      await page.click('button[type="submit"]');
      
      // Should show error about existing account
      const errorMessage = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      await expect(errorMessage).toBeVisible({ timeout: 5000 });
      await expect(errorMessage).toContainText(/already|exists|taken/i);
    });

    test('should validate password requirements', async ({ page }) => {
      await page.goto('/signup');
      
      // Try weak password
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com');
      await page.fill('input[name="password"], input[type="password"]', '123');
      
      // Submit or blur to trigger validation
      await page.press('input[name="password"], input[type="password"]', 'Tab');
      
      // Should show password requirements
      const passwordError = page.locator('.error, [role="alert"], .text-red-500, .text-destructive');
      const passwordRequirements = page.locator('text=/[0-9]+.*characters|minimum|weak/i');
      
      await expect(passwordError.or(passwordRequirements).first()).toBeVisible({ timeout: 5000 });
    });

    test('should navigate to login page', async ({ page }) => {
      await page.goto('/signup');
      
      // Click on login link
      const loginLink = page.locator('a[href="/login"], a:has-text("Sign in"), a:has-text("Log in")');
      await loginLink.click();
      
      // Should navigate to login page
      await page.waitForURL('/login');
      await expect(page.locator('h1, h2').first()).toContainText(/sign in|login/i);
    });
  });

  test.describe('Session Management', () => {
    test('should logout successfully', async ({ page, auth }) => {
      // First login
      const testUser = auth.getTestUser();
      await auth.loginAs(testUser.email, testUser.password);
      
      // Find and click logout
      const userMenu = page.locator('[data-testid="user-menu"], [data-testid="user-avatar"], button:has-text("Account")');
      if (await userMenu.isVisible()) {
        await userMenu.click();
        const logoutButton = page.locator('[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign out")');
        await logoutButton.click();
      } else {
        // Direct logout button
        const logoutButton = page.locator('button:has-text("Logout"), button:has-text("Sign out")');
        await logoutButton.click();
      }
      
      // Should redirect to login page
      await page.waitForURL('/login', { timeout: 5000 });
    });

    test('should redirect to login when accessing protected route', async ({ page }) => {
      // Clear any existing session
      await page.context().clearCookies();
      await page.evaluate(() => {
        localStorage.clear();
        sessionStorage.clear();
      });
      
      // Try to access protected route
      await page.goto('/contracts');
      
      // Should redirect to login
      await page.waitForURL('/login', { timeout: 5000 });
    });

    test('should persist session on page reload', async ({ page, auth }) => {
      // Login first
      const testUser = auth.getTestUser();
      await auth.loginAs(testUser.email, testUser.password);
      
      // Reload page
      await page.reload();
      
      // Should still be logged in
      await expect(page).toHaveURL('/');
      const userIndicator = page.locator('[data-testid="user-menu"], [data-testid="user-avatar"], .user-menu');
      await expect(userIndicator).toBeVisible({ timeout: 5000 });
    });

    test('should handle session expiry gracefully', async ({ page, auth }) => {
      // Login first
      const testUser = auth.getTestUser();
      await auth.loginAs(testUser.email, testUser.password);
      
      // Simulate session expiry by clearing auth tokens
      await page.evaluate(() => {
        // Clear Supabase session from localStorage
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
          if (key.includes('supabase') || key.includes('auth')) {
            localStorage.removeItem(key);
          }
        });
      });
      
      // Try to navigate to protected route
      await page.goto('/contracts');
      
      // Should redirect to login
      await page.waitForURL('/login', { timeout: 5000 });
    });
  });
});
