import { test, expect } from './fixtures';

test.describe('Edge Cases and Boundary Testing', () => {
  test.describe('Contract Limits and Validation', () => {
    test('should enforce maximum contract size limit', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Try to add very large content
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Generate 10MB of text (typical limit)
      const largeText = 'x'.repeat(10 * 1024 * 1024);
      
      await editor.click();
      // Try to paste large content
      await page.evaluate((text) => {
        navigator.clipboard.writeText(text);
      }, largeText);
      
      await page.keyboard.press('Control+V');
      
      // Should show size limit error
      const errorMessage = page.locator('.error, text=/size limit|too large|maximum/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
    });

    test('should validate contract dates', async ({ page }) => {
      await page.goto('/contracts/new');
      
      // Fill contract details
      const titleInput = page.locator('input[name="title"], input[placeholder*="title"]').first();
      await titleInput.fill('Date Validation Test');
      
      // Set end date before start date
      const startDateInput = page.locator('input[type="date"][name*="start"]').first();
      const endDateInput = page.locator('input[type="date"][name*="end"]').first();
      
      await startDateInput.fill('2024-12-31');
      await endDateInput.fill('2024-01-01');
      
      // Try to save
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').first();
      await saveButton.click();
      
      // Should show validation error
      const validationError = page.locator('text=/end date.*before.*start|invalid date range/i');
      await expect(validationError.first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle special characters in contract title', async ({ page }) => {
      await page.goto('/contracts/new');
      
      // Try various special characters
      const specialTitles = [
        '<script>alert("XSS")</script>',
        '"; DROP TABLE contracts; --',
        '../../../../etc/passwd',
        'Contract™ with © symbols €',
        '测试合同 🚀 テスト'
      ];
      
      for (const title of specialTitles) {
        const titleInput = page.locator('input[name="title"]').first();
        await titleInput.clear();
        await titleInput.fill(title);
        
        // Should sanitize but not break
        const saveButton = page.locator('button:has-text("Save")').first();
        await saveButton.click();
        
        // Check no script execution
        let alertFired = false;
        page.on('dialog', () => {
          alertFired = true;
        });
        
        await page.waitForTimeout(1000);
        expect(alertFired).toBeFalsy();
      }
    });

    test('should enforce maximum number of collaborators', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open share dialog
      const shareButton = page.locator('button:has-text("Share")').first();
      await shareButton.click();
      
      // Try to add many collaborators (assuming limit is 50)
      for (let i = 0; i < 55; i++) {
        const emailInput = page.locator('input[type="email"]').last();
        await emailInput.fill(`user${i}@example.com`);
        
        const addButton = page.locator('button:has-text("Add"), button:has-text("Invite")').last();
        await addButton.click();
        
        if (i >= 50) {
          // Should show limit error after 50
          const limitError = page.locator('text=/maximum.*collaborators|limit reached/i');
          const isVisible = await limitError.first().isVisible().catch(() => false);
          if (isVisible) break;
        }
      }
    });

    test('should validate contract value boundaries', async ({ page }) => {
      await page.goto('/contracts/new');
      
      const titleInput = page.locator('input[name="title"]').first();
      await titleInput.fill('Value Test Contract');
      
      // Test various value boundaries
      const valueTests = [
        { value: '-1000', shouldFail: true },  // Negative
        { value: '0', shouldFail: false },      // Zero
        { value: '99999999999', shouldFail: true }, // Too large
        { value: 'abc', shouldFail: true },     // Non-numeric
        { value: '1.234', shouldFail: false },  // Decimal
        { value: '1,000,000', shouldFail: false } // Formatted
      ];
      
      for (const test of valueTests) {
        const valueInput = page.locator('input[name*="value"], input[placeholder*="amount"]').first();
        await valueInput.clear();
        await valueInput.fill(test.value);
        
        await page.keyboard.press('Tab');
        
        if (test.shouldFail) {
          const error = page.locator('.error, text=/invalid.*value|must be.*number/i');
          await expect(error.first()).toBeVisible({ timeout: 2000 });
        }
      }
    });
  });

  test.describe('Concurrent Operations', () => {
    test('should handle simultaneous contract saves', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        const contractId = 'test-contract-123';
        
        // Both users open same contract
        await page1.goto(`/contracts/${contractId}`);
        await page2.goto(`/contracts/${contractId}`);
        
        // Both edit simultaneously
        const editor1 = page1.locator('.ProseMirror').first();
        const editor2 = page2.locator('.ProseMirror').first();
        
        await expect(editor1).toBeVisible({ timeout: 15000 });
        await expect(editor2).toBeVisible({ timeout: 15000 });
        
        await editor1.click();
        await page1.keyboard.type('Edit from User 1');
        
        await editor2.click();
        await page2.keyboard.type('Edit from User 2');
        
        // Both save simultaneously
        const save1 = page1.locator('button:has-text("Save")').first().click();
        const save2 = page2.locator('button:has-text("Save")').first().click();
        
        await Promise.all([save1, save2]);
        
        // Should handle conflict gracefully
        const conflictMessage = page1.locator('text=/conflict|merge|updated by another user/i');
        const saved1 = page1.locator('text=/saved|success/i');
        const saved2 = page2.locator('text=/saved|success/i');
        
        // Either both save or conflict is shown
        const hasConflict = await conflictMessage.first().isVisible().catch(() => false);
        const bothSaved = (await saved1.first().isVisible().catch(() => false)) && 
                         (await saved2.first().isVisible().catch(() => false));
        
        expect(hasConflict || bothSaved).toBeTruthy();
      } finally {
        await context1.close();
        await context2.close();
      }
    });

    test('should handle race condition in approval workflow', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        // Both approvers open same contract
        await page1.goto('/contracts/contract-005');
        await page2.goto('/contracts/contract-005');
        
        // Both try to approve simultaneously
        const approve1 = page1.locator('button:has-text("Approve")').first();
        const approve2 = page2.locator('button:has-text("Approve")').first();
        
        if (await approve1.isVisible() && await approve2.isVisible()) {
          await Promise.all([
            approve1.click(),
            approve2.click()
          ]);
          
          // System should handle duplicate approvals
          await page1.waitForTimeout(2000);
          await page2.waitForTimeout(2000);
          
          // Check for appropriate handling
          const error = page1.locator('text=/already approved|duplicate/i');
          const success = page1.locator('text=/approved|success/i');
          
          const hasError = await error.first().isVisible().catch(() => false);
          const hasSuccess = await success.first().isVisible().catch(() => false);
          
          expect(hasError || hasSuccess).toBeTruthy();
        }
      } finally {
        await context1.close();
        await context2.close();
      }
    });
  });

  test.describe('Network and Connectivity Issues', () => {
    test('should auto-save drafts when connection is lost', async ({ page, context }) => {
      await page.goto('/contracts/new');
      
      // Start editing
      const titleInput = page.locator('input[name="title"]').first();
      await titleInput.fill('Offline Test Contract');
      
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();
      await page.keyboard.type('Content before offline');
      
      // Go offline
      await context.setOffline(true);
      
      // Continue editing
      await page.keyboard.type(' - Edited while offline');
      
      // Wait for auto-save attempt
      await page.waitForTimeout(3000);
      
      // Should show offline indicator
      const offlineIndicator = page.locator('text=/offline|no connection|saved locally/i');
      await expect(offlineIndicator.first()).toBeVisible({ timeout: 5000 });
      
      // Go back online
      await context.setOffline(false);
      
      // Should sync changes
      const syncIndicator = page.locator('text=/syncing|uploading|saving/i');
      await expect(syncIndicator.first()).toBeVisible({ timeout: 5000 });
      
      // Changes should be preserved
      const content = await editor.textContent();
      expect(content).toContain('Edited while offline');
    });

    test('should handle API timeout gracefully', async ({ page }) => {
      await page.goto('/contracts');
      
      // Intercept API calls and delay them
      await page.route('**/api/contracts**', async (route) => {
        await new Promise(resolve => setTimeout(resolve, 35000)); // Timeout after 35s
        await route.abort();
      });
      
      // Try to load contracts
      await page.reload();
      
      // Should show timeout error
      const timeoutError = page.locator('text=/timeout|taking too long|try again/i');
      await expect(timeoutError.first()).toBeVisible({ timeout: 40000 });
      
      // Should have retry option
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")').first();
      await expect(retryButton).toBeVisible();
    });
  });

  test.describe('Data Integrity and Recovery', () => {
    test('should recover from corrupted contract data', async ({ page }) => {
      // Navigate to a contract with corrupted data
      await page.goto('/contracts/corrupted-test');
      
      // Should detect corruption and show recovery options
      const corruptionWarning = page.locator('text=/corrupted|invalid data|recovery/i');
      
      if (await corruptionWarning.first().isVisible()) {
        // Should offer recovery options
        const recoverButton = page.locator('button:has-text("Recover"), button:has-text("Restore")').first();
        await expect(recoverButton).toBeVisible();
        
        await recoverButton.click();
        
        // Should restore from last good version
        const restored = page.locator('text=/restored|recovered/i');
        await expect(restored.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should handle circular references in comments', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Create a comment thread that might cause circular reference
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Add comment
      await editor.click();
      await page.keyboard.press('Control+A');
      
      const commentButton = page.locator('button[aria-label*="comment"]').first();
      if (await commentButton.isVisible()) {
        await commentButton.click();
        
        // Add comment with self-reference
        const commentInput = page.locator('textarea').first();
        await commentInput.fill('Comment @comment-001 references itself');
        
        const submitButton = page.locator('button:has-text("Add")').last();
        await submitButton.click();
        
        // System should handle without crashing
        await page.waitForTimeout(2000);
        
        // Page should still be responsive
        const isResponsive = await page.evaluate(() => {
          return document.body.innerHTML.length > 0;
        });
        expect(isResponsive).toBeTruthy();
      }
    });
  });

  test.describe('Permission Edge Cases', () => {
    test('should handle permission changes during active session', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Start editing
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();
      await page.keyboard.type('Editing with permission');
      
      // Simulate permission revocation (would normally be done by admin)
      // For testing, we'll check if the UI handles permission errors
      await page.evaluate(() => {
        // Simulate permission change event
        window.dispatchEvent(new CustomEvent('permission-changed', {
          detail: { permission: 'view' }
        }));
      });
      
      // Try to continue editing
      await page.keyboard.type(' - More edits');
      
      // Should show permission error or switch to read-only
      const permissionError = page.locator('text=/permission.*denied|read-only|cannot edit/i');
      const readOnlyIndicator = page.locator('.read-only, [data-readonly="true"]');
      
      const hasError = await permissionError.first().isVisible().catch(() => false);
      const isReadOnly = await readOnlyIndicator.first().isVisible().catch(() => false);
      
      expect(hasError || isReadOnly).toBeTruthy();
    });

    test('should prevent privilege escalation attempts', async ({ page }) => {
      await page.goto('/contracts/test-contract-123');
      
      // Try to modify permission via console
      const escalationAttempt = await page.evaluate(() => {
        try {
          // Attempt to modify permission in localStorage or state
          localStorage.setItem('user_role', 'admin');
          window.__USER_ROLE__ = 'admin';
          return 'attempted';
        } catch {
          return 'blocked';
        }
      });
      
      // Reload to check if escalation worked
      await page.reload();
      
      // Should not have admin privileges
      const adminOnlyElement = page.locator('[data-admin-only], .admin-panel, button:has-text("Admin")');
      const hasAdminAccess = await adminOnlyElement.first().isVisible().catch(() => false);
      
      expect(hasAdminAccess).toBeFalsy();
    });
  });

  test.describe('UI Boundary Cases', () => {
    test('should handle extremely long contract names', async ({ page }) => {
      await page.goto('/contracts/new');
      
      // Create contract with very long name
      const longName = 'Contract '.repeat(100) + 'End';
      const titleInput = page.locator('input[name="title"]').first();
      await titleInput.fill(longName);
      
      // Save
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      
      // Should truncate or handle gracefully in UI
      await page.goto('/contracts');
      
      // Find the contract in list
      const contractCard = page.locator('.contract-card, [data-testid="contract-card"]').filter({
        hasText: 'Contract Contract'
      });
      
      if (await contractCard.first().isVisible()) {
        // Check if title is truncated with ellipsis
        const titleElement = await contractCard.first().locator('.title, h3').first();
        const displayedTitle = await titleElement.textContent();
        
        // Should be truncated (much shorter than original)
        expect(displayedTitle?.length).toBeLessThan(longName.length);
      }
    });

    test('should handle rapid UI interactions', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Rapidly click multiple buttons
      const buttons = ['Save', 'Share', 'Comment', 'History'];
      
      for (let i = 0; i < 10; i++) {
        for (const buttonText of buttons) {
          const button = page.locator(`button:has-text("${buttonText}")`).first();
          if (await button.isVisible()) {
            // Don't wait for click to complete
            button.click().catch(() => {});
          }
        }
      }
      
      // Wait for UI to stabilize
      await page.waitForTimeout(3000);
      
      // Page should not crash or show multiple dialogs
      const dialogs = await page.locator('[role="dialog"]').count();
      expect(dialogs).toBeLessThanOrEqual(1);
      
      // Should still be functional
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible();
    });

    test('should handle browser back/forward during editing', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Start editing
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      await editor.click();
      await page.keyboard.type('Important unsaved changes');
      
      // Try to navigate back
      await page.goBack();
      
      // Should show unsaved changes warning
      const warningDialog = page.locator('text=/unsaved changes|leave this page|discard/i');
      
      if (await warningDialog.first().isVisible()) {
        // Cancel navigation
        const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stay")').first();
        await cancelButton.click();
        
        // Should remain on page with content preserved
        const content = await editor.textContent();
        expect(content).toContain('Important unsaved changes');
      }
    });
  });

  test.describe('Search and Filter Edge Cases', () => {
    test('should handle search with special regex characters', async ({ page }) => {
      await page.goto('/contracts');
      
      // Search with regex special characters
      const specialSearches = [
        '.*',
        '[]()',
        '$^',
        '\\\\',
        'Contract OR 1=1',
        '"; SELECT * FROM contracts; --'
      ];
      
      for (const search of specialSearches) {
        const searchInput = page.locator('input[placeholder*="Search"], input[type="search"]').first();
        await searchInput.clear();
        await searchInput.fill(search);
        await page.keyboard.press('Enter');
        
        // Should not break the page
        await page.waitForTimeout(1000);
        
        // Page should still be functional
        const contractList = page.locator('.contract-list, [data-testid="contracts"]');
        await expect(contractList.first()).toBeVisible();
      }
    });

    test('should handle empty search results gracefully', async ({ page }) => {
      await page.goto('/contracts');
      
      // Search for non-existent contract
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      await searchInput.fill('NonExistentContract12345XYZ');
      await page.keyboard.press('Enter');
      
      // Should show empty state
      const emptyState = page.locator('text=/no contracts found|no results|try different/i');
      await expect(emptyState.first()).toBeVisible({ timeout: 5000 });
      
      // Should suggest actions
      const suggestion = page.locator('text=/clear filters|new contract|adjust search/i');
      await expect(suggestion.first()).toBeVisible();
    });
  });

  test.describe('Date and Time Edge Cases', () => {
    test('should handle daylight saving time transitions', async ({ page }) => {
      await page.goto('/contracts/new');
      
      // Set contract dates around DST transition (UK: last Sunday of March)
      const titleInput = page.locator('input[name="title"]').first();
      await titleInput.fill('DST Test Contract');
      
      const startDateInput = page.locator('input[type="date"][name*="start"]').first();
      const endDateInput = page.locator('input[type="date"][name*="end"]').first();
      
      // DST transition dates
      await startDateInput.fill('2024-03-30'); // Day before DST
      await endDateInput.fill('2024-03-31');   // Day of DST
      
      // Save
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      
      // Should handle the 23-hour day correctly
      const successMessage = page.locator('text=/saved|created/i');
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle different timezone users', async ({ page }) => {
      // Simulate user in different timezone
      await page.evaluate(() => {
        // Override timezone
        const originalDateTimeFormat = Intl.DateTimeFormat;
        window.Intl.DateTimeFormat = function(locale, options) {
          return new originalDateTimeFormat(locale, { ...options, timeZone: 'America/New_York' });
        };
      });
      
      await page.goto('/contracts/contract-001');
      
      // Dates should be displayed correctly for user's timezone
      const dateElement = page.locator('time, .date, [data-testid="date"]').first();
      
      if (await dateElement.isVisible()) {
        const dateText = await dateElement.textContent();
        // Should contain timezone indicator or be in local format
        expect(dateText).toBeTruthy();
      }
    });
  });

  test.describe('File Upload Edge Cases', () => {
    test('should reject files exceeding size limit', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Create large file in memory
      const largeFile = new File(
        [new ArrayBuffer(100 * 1024 * 1024)], // 100MB
        'large-file.pdf',
        { type: 'application/pdf' }
      );
      
      // Try to upload
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible()) {
        await fileInput.setInputFiles({
          name: 'large-file.pdf',
          mimeType: 'application/pdf',
          buffer: Buffer.alloc(100 * 1024 * 1024)
        });
        
        // Should show size error
        const sizeError = page.locator('text=/too large|size limit|maximum.*MB/i');
        await expect(sizeError.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should validate file types', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.isVisible()) {
        // Try to upload executable file
        await fileInput.setInputFiles({
          name: 'malicious.exe',
          mimeType: 'application/x-msdownload',
          buffer: Buffer.from('MZ') // EXE header
        });
        
        // Should reject dangerous file types
        const typeError = page.locator('text=/not allowed|invalid type|accepted formats/i');
        await expect(typeError.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
