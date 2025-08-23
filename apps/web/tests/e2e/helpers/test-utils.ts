import { Page, BrowserContext } from '@playwright/test';
import { faker } from '@faker-js/faker';

/**
 * Test data generators
 */
export class TestDataGenerator {
  static generateContract() {
    return {
      title: faker.company.catchPhrase() + ' Agreement',
      content: faker.lorem.paragraphs(3),
      type: faker.helpers.arrayElement(['nda', 'service', 'license', 'employment', 'supplier']),
      value: faker.number.float({ min: 1000, max: 1000000, precision: 0.01 }),
      currency: 'GBP',
      startDate: faker.date.future().toISOString().split('T')[0],
      endDate: faker.date.future({ years: 2 }).toISOString().split('T')[0],
      metadata: {
        client: faker.company.name(),
        category: faker.helpers.arrayElement(['legal', 'sales', 'procurement', 'hr']),
        risk_level: faker.helpers.arrayElement(['low', 'medium', 'high'])
      }
    };
  }

  static generateUser() {
    return {
      email: faker.internet.email({ provider: 'example.com' }),
      password: 'Test' + faker.internet.password({ length: 10 }) + '123!',
      fullName: faker.person.fullName(),
      role: faker.helpers.arrayElement(['user', 'manager', 'admin', 'legal']),
      department: faker.commerce.department(),
      phone: faker.phone.number('+44 ## #### ####')
    };
  }

  static generateComment() {
    return {
      content: faker.lorem.sentence(),
      mentions: faker.helpers.maybe(() => ['@' + faker.internet.userName()], { probability: 0.3 })
    };
  }

  static generateLargeContent(sizeInKB: number): string {
    const chunk = faker.lorem.paragraphs(10);
    const chunkSize = chunk.length;
    const targetSize = sizeInKB * 1024;
    const repetitions = Math.ceil(targetSize / chunkSize);
    return chunk.repeat(repetitions).substring(0, targetSize);
  }
}

/**
 * Authentication helpers
 */
export class AuthHelper {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.goto('/login');
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });
  }

  async logout() {
    const userMenu = this.page.locator('[data-testid="user-menu"], button[aria-label*="user"]').first();
    if (await userMenu.isVisible()) {
      await userMenu.click();
      const logoutButton = this.page.locator('button:has-text("Logout"), button:has-text("Sign out")').first();
      await logoutButton.click();
    }
  }

  async getCurrentUser() {
    return await this.page.evaluate(() => {
      // Try different storage methods
      const supabaseAuth = localStorage.getItem('supabase.auth.token');
      if (supabaseAuth) {
        try {
          const parsed = JSON.parse(supabaseAuth);
          return parsed.user || parsed.currentUser;
        } catch {}
      }
      return null;
    });
  }

  async impersonateUser(userId: string) {
    // For testing purposes - would need backend support
    await this.page.evaluate((id) => {
      localStorage.setItem('impersonate_user_id', id);
    }, userId);
  }
}

/**
 * Contract helpers
 */
export class ContractHelper {
  constructor(private page: Page) {}

  async createContract(data?: Partial<ReturnType<typeof TestDataGenerator.generateContract>>) {
    const contractData = { ...TestDataGenerator.generateContract(), ...data };
    
    await this.page.goto('/contracts/new');
    
    // Fill form
    await this.page.fill('input[name="title"]', contractData.title);
    
    const editor = this.page.locator('.ProseMirror').first();
    if (await editor.isVisible()) {
      await editor.click();
      await this.page.keyboard.type(contractData.content);
    }
    
    // Fill other fields if visible
    const valueInput = this.page.locator('input[name*="value"]').first();
    if (await valueInput.isVisible()) {
      await valueInput.fill(contractData.value.toString());
    }
    
    const startDate = this.page.locator('input[type="date"][name*="start"]').first();
    if (await startDate.isVisible()) {
      await startDate.fill(contractData.startDate);
    }
    
    const endDate = this.page.locator('input[type="date"][name*="end"]').first();
    if (await endDate.isVisible()) {
      await endDate.fill(contractData.endDate);
    }
    
    // Save
    await this.page.click('button:has-text("Save"), button:has-text("Create")');
    
    // Wait for success
    await this.page.waitForURL(/\/contracts\/[\w-]+/, { timeout: 10000 });
    
    // Extract contract ID from URL
    const url = this.page.url();
    const contractId = url.split('/contracts/')[1]?.split('?')[0];
    
    return { ...contractData, id: contractId };
  }

  async shareContract(contractId: string, email: string, permission: 'view' | 'edit' | 'approve' = 'view') {
    await this.page.goto(`/contracts/${contractId}`);
    await this.page.click('button:has-text("Share")');
    
    const emailInput = this.page.locator('input[type="email"]').last();
    await emailInput.fill(email);
    
    const permissionSelect = this.page.locator('select, [role="combobox"]').last();
    if (await permissionSelect.isVisible()) {
      await permissionSelect.selectOption({ label: `Can ${permission}` });
    }
    
    await this.page.click('button:has-text("Invite"), button:has-text("Send")');
    
    // Wait for success
    const success = this.page.locator('text=/invited|sent|added/i');
    await success.first().waitFor({ state: 'visible', timeout: 5000 });
  }

  async approveContract(contractId: string, comment?: string) {
    await this.page.goto(`/contracts/${contractId}`);
    
    const approveButton = this.page.locator('button:has-text("Approve")').first();
    await approveButton.click();
    
    if (comment) {
      const commentInput = this.page.locator('textarea[placeholder*="comment"]').first();
      if (await commentInput.isVisible()) {
        await commentInput.fill(comment);
      }
    }
    
    const confirmButton = this.page.locator('button:has-text("Confirm"), button:has-text("Submit")').last();
    await confirmButton.click();
    
    // Wait for success
    const success = this.page.locator('text=/approved|success/i');
    await success.first().waitFor({ state: 'visible', timeout: 5000 });
  }
}

/**
 * Wait utilities
 */
export class WaitUtils {
  static async waitForNetworkIdle(page: Page, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async waitForAnimation(page: Page, duration = 300) {
    await page.waitForTimeout(duration);
  }

  static async retryOperation<T>(
    operation: () => Promise<T>,
    maxRetries = 3,
    delay = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    throw new Error('Max retries reached');
  }
}

/**
 * Performance monitoring
 */
export class PerformanceMonitor {
  private metrics: Map<string, number[]> = new Map();

  async measureOperation(name: string, operation: () => Promise<void>) {
    const start = Date.now();
    await operation();
    const duration = Date.now() - start;
    
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    this.metrics.get(name)!.push(duration);
    
    return duration;
  }

  getMetrics(name: string) {
    const times = this.metrics.get(name) || [];
    if (times.length === 0) return null;
    
    return {
      min: Math.min(...times),
      max: Math.max(...times),
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      median: this.getMedian(times),
      p95: this.getPercentile(times, 95),
      p99: this.getPercentile(times, 99)
    };
  }

  private getMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  private getPercentile(numbers: number[], percentile: number): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  generateReport(): string {
    let report = 'Performance Report\n==================\n\n';
    
    for (const [name, times] of this.metrics.entries()) {
      const metrics = this.getMetrics(name);
      if (metrics) {
        report += `${name}:\n`;
        report += `  Min: ${metrics.min}ms\n`;
        report += `  Max: ${metrics.max}ms\n`;
        report += `  Avg: ${metrics.avg.toFixed(2)}ms\n`;
        report += `  Median: ${metrics.median}ms\n`;
        report += `  P95: ${metrics.p95}ms\n`;
        report += `  P99: ${metrics.p99}ms\n\n`;
      }
    }
    
    return report;
  }
}

/**
 * Database helpers for test setup/teardown
 */
export class DatabaseHelper {
  static async clearTestData(context: BrowserContext) {
    // This would typically call an API endpoint to clear test data
    // For now, we'll clear local storage
    await context.clearCookies();
    await context.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
  }

  static async seedTestData(page: Page, scenario: 'minimal' | 'standard' | 'heavy' = 'standard') {
    // This would typically call an API endpoint to seed data
    // For now, we'll set a flag in localStorage
    await page.evaluate((s) => {
      localStorage.setItem('test_scenario', s);
    }, scenario);
  }
}

/**
 * Network helpers
 */
export class NetworkHelper {
  static async simulateSlowNetwork(context: BrowserContext) {
    // Simulate 3G network
    await context.route('**/*', (route) => {
      setTimeout(() => route.continue(), 500);
    });
  }

  static async simulateOffline(context: BrowserContext) {
    await context.setOffline(true);
  }

  static async simulateNetworkError(page: Page, urlPattern: string) {
    await page.route(urlPattern, (route) => {
      route.abort('failed');
    });
  }

  static async interceptAPICall(page: Page, urlPattern: string, response: any) {
    await page.route(urlPattern, (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response)
      });
    });
  }
}

/**
 * Accessibility helpers
 */
export class AccessibilityHelper {
  static async checkA11y(page: Page, selector?: string) {
    const target = selector ? page.locator(selector) : page;
    
    // Check for basic accessibility issues
    const issues: string[] = [];
    
    // Check for alt text on images
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} images without alt text`);
    }
    
    // Check for form labels
    const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([id])').count();
    if (inputsWithoutLabels > 0) {
      issues.push(`${inputsWithoutLabels} inputs without labels`);
    }
    
    // Check for heading hierarchy
    const h1Count = await page.locator('h1').count();
    if (h1Count !== 1) {
      issues.push(`Page has ${h1Count} h1 elements (should have exactly 1)`);
    }
    
    return {
      passed: issues.length === 0,
      issues
    };
  }

  static async checkKeyboardNavigation(page: Page) {
    // Tab through interactive elements
    const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]').all();
    
    for (let i = 0; i < Math.min(interactiveElements.length, 10); i++) {
      await page.keyboard.press('Tab');
      
      // Check if an element has focus
      const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
      if (!focusedElement) {
        return { passed: false, message: 'Lost focus during keyboard navigation' };
      }
    }
    
    return { passed: true };
  }
}

/**
 * Screenshot helpers
 */
export class ScreenshotHelper {
  static async captureFullPage(page: Page, name: string) {
    await page.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`,
      fullPage: true
    });
  }

  static async captureElement(page: Page, selector: string, name: string) {
    const element = page.locator(selector).first();
    await element.screenshot({
      path: `screenshots/${name}-${Date.now()}.png`
    });
  }

  static async compareScreenshots(page: Page, name: string, selector?: string) {
    const options = {
      maxDiffPixels: 100,
      threshold: 0.2
    };
    
    if (selector) {
      await expect(page.locator(selector).first()).toHaveScreenshot(name, options);
    } else {
      await expect(page).toHaveScreenshot(name, options);
    }
  }
}
