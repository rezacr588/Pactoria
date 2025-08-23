import { test, expect } from './fixtures';
import { 
  PerformanceMonitor, 
  TestDataGenerator, 
  ContractHelper,
  WaitUtils,
  NetworkHelper 
} from './helpers/test-utils';

test.describe('Performance and Load Testing', () => {
  let monitor: PerformanceMonitor;

  test.beforeEach(() => {
    monitor = new PerformanceMonitor();
  });

  test.afterEach(async () => {
    // Log performance metrics after each test
    console.log(monitor.generateReport());
  });

  test.describe('Page Load Performance', () => {
    test('should load dashboard within acceptable time', async ({ page }) => {
      const loadTime = await monitor.measureOperation('dashboard-load', async () => {
        await page.goto('/dashboard');
        await page.waitForLoadState('networkidle');
      });

      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);

      // Check Time to First Byte (TTFB)
      const performanceTiming = await page.evaluate(() => {
        const timing = performance.timing;
        return {
          ttfb: timing.responseStart - timing.navigationStart,
          domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
          loadComplete: timing.loadEventEnd - timing.navigationStart
        };
      });

      expect(performanceTiming.ttfb).toBeLessThan(800);
      expect(performanceTiming.domContentLoaded).toBeLessThan(2000);
      expect(performanceTiming.loadComplete).toBeLessThan(3000);
    });

    test('should load contract list with 100+ items efficiently', async ({ page }) => {
      await page.goto('/contracts');

      const loadTime = await monitor.measureOperation('contract-list-heavy', async () => {
        // Assuming the page loads performance test contracts
        await page.waitForSelector('.contract-card, [data-testid="contract-card"]');
      });

      // Should load within 5 seconds even with many items
      expect(loadTime).toBeLessThan(5000);

      // Check if virtualization or pagination is implemented
      const visibleContracts = await page.locator('.contract-card:visible').count();
      const totalContracts = await page.locator('.contract-card').count();

      // If more than 50 contracts, should use virtualization or pagination
      if (totalContracts > 50) {
        expect(visibleContracts).toBeLessThanOrEqual(50);
      }
    });

    test('should handle large contract document efficiently', async ({ page }) => {
      // Navigate to large contract (created in seed data)
      const loadTime = await monitor.measureOperation('large-contract-load', async () => {
        await page.goto('/contracts/contract-010');
        await page.waitForSelector('.ProseMirror');
      });

      // Large contract should load within 5 seconds
      expect(loadTime).toBeLessThan(5000);

      // Check memory usage doesn't spike
      const memoryUsage = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory usage should be under 100MB for a single contract
      if (memoryUsage > 0) {
        expect(memoryUsage).toBeLessThan(100 * 1024 * 1024);
      }
    });
  });

  test.describe('Search and Filter Performance', () => {
    test('should perform search quickly with large dataset', async ({ page }) => {
      await page.goto('/contracts');
      
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      
      const searchTime = await monitor.measureOperation('search-performance', async () => {
        await searchInput.fill('performance');
        await page.keyboard.press('Enter');
        
        // Wait for results to update
        await page.waitForTimeout(500);
      });

      // Search should complete within 1 second
      expect(searchTime).toBeLessThan(1000);
    });

    test('should handle complex filters efficiently', async ({ page }) => {
      await page.goto('/contracts');

      const filterTime = await monitor.measureOperation('complex-filter', async () => {
        // Apply multiple filters
        const statusFilter = page.locator('select[name*="status"], [data-testid="status-filter"]').first();
        if (await statusFilter.isVisible()) {
          await statusFilter.selectOption('active');
        }

        const dateFilter = page.locator('input[type="date"][name*="from"]').first();
        if (await dateFilter.isVisible()) {
          await dateFilter.fill('2024-01-01');
        }

        const valueFilter = page.locator('input[name*="min-value"]').first();
        if (await valueFilter.isVisible()) {
          await valueFilter.fill('10000');
        }

        // Wait for results
        await page.waitForTimeout(500);
      });

      // Complex filtering should complete within 2 seconds
      expect(filterTime).toBeLessThan(2000);
    });
  });

  test.describe('Editor Performance', () => {
    test('should handle rapid typing without lag', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);

      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();

      // Type rapidly
      const typingTime = await monitor.measureOperation('rapid-typing', async () => {
        const text = 'The quick brown fox jumps over the lazy dog. ';
        for (let i = 0; i < 20; i++) {
          await page.keyboard.type(text, { delay: 10 });
        }
      });

      // Calculate typing speed
      const totalChars = 20 * 46; // 46 chars per sentence
      const charsPerSecond = (totalChars / typingTime) * 1000;

      // Should maintain at least 30 chars/second
      expect(charsPerSecond).toBeGreaterThan(30);
    });

    test('should handle large paste operations', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);

      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();

      // Generate large content (500KB)
      const largeContent = TestDataGenerator.generateLargeContent(500);

      const pasteTime = await monitor.measureOperation('large-paste', async () => {
        await page.evaluate((content) => {
          navigator.clipboard.writeText(content);
        }, largeContent);

        await page.keyboard.press('Control+V');
        await page.waitForTimeout(1000);
      });

      // Large paste should complete within 3 seconds
      expect(pasteTime).toBeLessThan(3000);
    });
  });

  test.describe('Concurrent Operations Load Test', () => {
    test('should handle 10 concurrent users editing', async ({ browser }) => {
      const contexts = [];
      const pages = [];

      try {
        // Create 10 browser contexts
        for (let i = 0; i < 10; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }

        const contractId = 'stress-test-contract';

        const loadTime = await monitor.measureOperation('10-users-concurrent', async () => {
          // All users open same document
          await Promise.all(pages.map(page => page.goto(`/contracts/${contractId}`)));

          // Wait for all editors to load
          await Promise.all(pages.map(async page => {
            const editor = page.locator('.ProseMirror').first();
            await expect(editor).toBeVisible({ timeout: 30000 });
          }));

          // Each user types
          await Promise.all(pages.map(async (page, index) => {
            const editor = page.locator('.ProseMirror').first();
            await editor.click();
            await page.keyboard.type(`User ${index} input `);
          }));
        });

        // Should handle 10 concurrent users within 30 seconds
        expect(loadTime).toBeLessThan(30000);

        // Check if all changes are synchronized
        await Promise.all(pages.map(page => page.waitForTimeout(3000)));

        for (let i = 0; i < pages.length; i++) {
          const content = await pages[i].locator('.ProseMirror').first().textContent();
          for (let j = 0; j < 10; j++) {
            expect(content).toContain(`User ${j} input`);
          }
        }
      } finally {
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should handle rapid contract creation', async ({ page }) => {
      const helper = new ContractHelper(page);
      const contracts = [];

      const creationTime = await monitor.measureOperation('rapid-creation', async () => {
        for (let i = 0; i < 5; i++) {
          const contract = await helper.createContract({
            title: `Performance Test Contract ${i}`
          });
          contracts.push(contract);
        }
      });

      // Should create 5 contracts within 30 seconds
      expect(creationTime).toBeLessThan(30000);
      expect(contracts.length).toBe(5);

      // Average time per contract
      const avgTime = creationTime / 5;
      expect(avgTime).toBeLessThan(6000); // 6 seconds per contract
    });
  });

  test.describe('API Response Times', () => {
    test('should load contracts API quickly', async ({ page }) => {
      let apiResponseTime = 0;

      // Intercept API calls to measure response time
      page.on('response', response => {
        if (response.url().includes('/api/contracts')) {
          apiResponseTime = response.timing()?.responseEnd || 0;
        }
      });

      await page.goto('/contracts');
      await page.waitForLoadState('networkidle');

      // API should respond within 1 second
      if (apiResponseTime > 0) {
        expect(apiResponseTime).toBeLessThan(1000);
      }
    });

    test('should handle API rate limiting gracefully', async ({ page }) => {
      await page.goto('/contracts');

      // Make rapid API requests
      const requests = [];
      for (let i = 0; i < 20; i++) {
        requests.push(page.reload());
      }

      await Promise.all(requests);

      // Page should still be functional
      const isPageWorking = await page.locator('h1, h2').first().isVisible();
      expect(isPageWorking).toBeTruthy();

      // Check for rate limit message if any
      const rateLimitMessage = page.locator('text=/rate limit|too many requests/i');
      if (await rateLimitMessage.isVisible()) {
        // Should show user-friendly message
        const messageText = await rateLimitMessage.textContent();
        expect(messageText).toBeTruthy();
      }
    });
  });

  test.describe('Memory and Resource Management', () => {
    test('should not leak memory during extended use', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();

      // Initial memory measurement
      await page.goto(`/contracts/${contractId}`);
      const initialMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Perform many operations
      for (let i = 0; i < 10; i++) {
        // Navigate between pages
        await page.goto('/contracts');
        await page.goto(`/contracts/${contractId}`);

        // Edit content
        const editor = page.locator('.ProseMirror').first();
        if (await editor.isVisible()) {
          await editor.click();
          await page.keyboard.type(`Iteration ${i} `);
        }

        // Open and close dialogs
        const shareButton = page.locator('button:has-text("Share")').first();
        if (await shareButton.isVisible()) {
          await shareButton.click();
          await page.keyboard.press('Escape');
        }
      }

      // Final memory measurement
      const finalMemory = await page.evaluate(() => {
        if ('memory' in performance) {
          return (performance as any).memory.usedJSHeapSize;
        }
        return 0;
      });

      // Memory increase should be reasonable (less than 50MB)
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryIncrease = finalMemory - initialMemory;
        expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
      }
    });

    test('should handle browser resize efficiently', async ({ page }) => {
      await page.goto('/contracts');

      const resizeTime = await monitor.measureOperation('resize-performance', async () => {
        // Test different viewport sizes
        const viewports = [
          { width: 1920, height: 1080 },
          { width: 1366, height: 768 },
          { width: 768, height: 1024 },
          { width: 375, height: 667 },
          { width: 1920, height: 1080 }
        ];

        for (const viewport of viewports) {
          await page.setViewportSize(viewport);
          await page.waitForTimeout(100);
        }
      });

      // Resizing should be smooth (under 2 seconds for all sizes)
      expect(resizeTime).toBeLessThan(2000);

      // Check layout is correct after resize
      const isLayoutCorrect = await page.locator('.contract-list, [data-testid="contracts"]').isVisible();
      expect(isLayoutCorrect).toBeTruthy();
    });
  });

  test.describe('Network Performance', () => {
    test('should work acceptably on slow 3G', async ({ page, context }) => {
      // Simulate slow 3G
      await NetworkHelper.simulateSlowNetwork(context);

      const loadTime = await monitor.measureOperation('slow-3g-load', async () => {
        await page.goto('/contracts');
        await page.waitForSelector('.contract-card, [data-testid="contract-card"]', { timeout: 30000 });
      });

      // Should load within 15 seconds on slow connection
      expect(loadTime).toBeLessThan(15000);

      // Critical content should be prioritized
      const headerVisible = await page.locator('header, nav').first().isVisible();
      expect(headerVisible).toBeTruthy();
    });

    test('should cache static assets effectively', async ({ page }) => {
      // First load
      await page.goto('/');
      
      // Get all static assets
      const assetSizes: { [key: string]: number } = {};
      page.on('response', response => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css') || url.includes('.woff')) {
          response.body().then(body => {
            assetSizes[url] = body.length;
          });
        }
      });

      // Second load (should use cache)
      await page.reload();

      // Check cache headers
      page.on('response', response => {
        const url = response.url();
        if (url.includes('.js') || url.includes('.css')) {
          const cacheControl = response.headers()['cache-control'];
          if (cacheControl) {
            // Should have reasonable cache time
            expect(cacheControl).toMatch(/max-age=\d+/);
          }
        }
      });
    });
  });

  test.describe('Bulk Operations Performance', () => {
    test('should handle bulk contract export efficiently', async ({ page }) => {
      await page.goto('/contracts');

      // Select multiple contracts
      const checkboxes = page.locator('input[type="checkbox"][name*="select"]');
      const checkboxCount = await checkboxes.count();

      if (checkboxCount > 0) {
        // Select up to 20 contracts
        for (let i = 0; i < Math.min(checkboxCount, 20); i++) {
          await checkboxes.nth(i).check();
        }

        // Export selected
        const exportButton = page.locator('button:has-text("Export")').first();
        if (await exportButton.isVisible()) {
          const exportTime = await monitor.measureOperation('bulk-export', async () => {
            await exportButton.click();
            
            // Wait for export to complete
            const successMessage = page.locator('text=/exported|download/i');
            await successMessage.first().waitFor({ state: 'visible', timeout: 10000 });
          });

          // Bulk export should complete within 10 seconds
          expect(exportTime).toBeLessThan(10000);
        }
      }
    });

    test('should handle bulk approval efficiently', async ({ page }) => {
      await page.goto('/contracts?status=pending_approval');

      const approveButtons = page.locator('button:has-text("Approve")');
      const buttonCount = await approveButtons.count();

      if (buttonCount > 0) {
        const approvalTime = await monitor.measureOperation('bulk-approval', async () => {
          // Approve up to 5 contracts
          for (let i = 0; i < Math.min(buttonCount, 5); i++) {
            await approveButtons.nth(i).click();
            
            // Confirm approval
            const confirmButton = page.locator('button:has-text("Confirm")').last();
            if (await confirmButton.isVisible()) {
              await confirmButton.click();
            }
            
            await page.waitForTimeout(500);
          }
        });

        // Bulk approval should average less than 3 seconds per contract
        const avgTime = approvalTime / Math.min(buttonCount, 5);
        expect(avgTime).toBeLessThan(3000);
      }
    });
  });

  test.describe('Real-time Collaboration Performance', () => {
    test('should sync changes quickly between users', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();

      try {
        const contractId = 'performance-test-contract';
        await page1.goto(`/contracts/${contractId}`);
        await page2.goto(`/contracts/${contractId}`);

        const editor1 = page1.locator('.ProseMirror').first();
        const editor2 = page2.locator('.ProseMirror').first();

        await expect(editor1).toBeVisible({ timeout: 15000 });
        await expect(editor2).toBeVisible({ timeout: 15000 });

        // Measure sync time
        await editor1.click();
        const testText = `Sync test ${Date.now()}`;
        
        const syncTime = await monitor.measureOperation('change-sync', async () => {
          await page1.keyboard.type(testText);
          
          // Wait for text to appear in page2
          await expect(editor2).toContainText(testText, { timeout: 5000 });
        });

        // Changes should sync within 2 seconds
        expect(syncTime).toBeLessThan(2000);
      } finally {
        await context1.close();
        await context2.close();
      }
    });
  });
});
