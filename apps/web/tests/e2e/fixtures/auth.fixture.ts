import { test as base, Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

export interface AuthFixture {
  authenticatedPage: Page;
  supabaseClient: ReturnType<typeof createClient>;
  loginAs: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  getTestUser: () => { email: string; password: string };
  getAdminUser: () => { email: string; password: string };
}

export const test = base.extend<{ auth: AuthFixture }>({
  auth: async ({ page }, use) => {
    // Initialize Supabase client for testing
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    // Helper function to login
    const loginAs = async (email: string, password: string) => {
      await page.goto('/login');
      await page.fill('input[name="email"]', email);
      await page.fill('input[name="password"]', password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation after successful login
      await page.waitForURL('/', { timeout: 10000 });
    };

    // Helper function to logout
    const logout = async () => {
      // Try to logout via UI if available
      const userMenuButton = page.locator('[data-testid="user-menu"]');
      if (await userMenuButton.isVisible()) {
        await userMenuButton.click();
        await page.click('[data-testid="logout-button"]');
        await page.waitForURL('/login', { timeout: 5000 });
      } else {
        // Fallback: clear cookies and local storage
        await page.context().clearCookies();
        await page.evaluate(() => {
          localStorage.clear();
          sessionStorage.clear();
        });
        await page.goto('/login');
      }
    };

    // Get test user credentials
    const getTestUser = () => ({
      email: process.env.TEST_USER_EMAIL || 'test@example.com',
      password: process.env.TEST_USER_PASSWORD || 'Test123456!',
    });

    // Get admin user credentials
    const getAdminUser = () => ({
      email: process.env.TEST_ADMIN_EMAIL || 'admin@example.com',
      password: process.env.TEST_ADMIN_PASSWORD || 'Admin123456!',
    });

    const authFixture: AuthFixture = {
      authenticatedPage: page,
      supabaseClient,
      loginAs,
      logout,
      getTestUser,
      getAdminUser,
    };

    await use(authFixture);
  },
});

export { expect } from '@playwright/test';
