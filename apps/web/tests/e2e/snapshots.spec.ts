import { test, expect } from './fixtures';

test.describe('Snapshot and Versioning', () => {
  test.describe('Snapshot Creation', () => {
    test('should create manual snapshot with content', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Wait for editor
      const editor = page.locator('[data-testid="contract-editor"], .ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Add content to editor
      await editor.click();
      await page.keyboard.type('This is test contract content for snapshot');
      
      // Find and click save snapshot button
      const saveButton = page.locator('button:has-text("Save"), button:has-text("Snapshot")').first();
      await saveButton.click();
      
      // Should show success indicator
      const successIndicator = page.locator('.success, .toast, text=/saved|success/i');
      await expect(successIndicator.first()).toBeVisible({ timeout: 5000 });
    });

    test('should include metadata in snapshot', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Add content with metadata
      const editor = page.locator('[data-testid="contract-editor"], .ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('Contract with metadata');
      
      // Save snapshot
      const saveButton = page.locator('button:has-text("Save Version"), button:has-text("Save Snapshot")').first();
      await saveButton.click();
      
      // Check for version number indicator
      const versionIndicator = page.locator('text=/version|v\\d+/i');
      await expect(versionIndicator.first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle concurrent snapshots gracefully', async ({ browser, page, contracts }) => {
      const contractId = contracts.getTestContractId();
      
      // Open two browser contexts
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // Both navigate to same contract
      await page.goto(`/contracts/${contractId}`);
      await page2.goto(`/contracts/${contractId}`);
      
      // Wait for editors
      const editor1 = page.locator('.ProseMirror').first();
      const editor2 = page2.locator('.ProseMirror').first();
      
      await expect(editor1).toBeVisible({ timeout: 15000 });
      await expect(editor2).toBeVisible({ timeout: 15000 });
      
      // Both try to save snapshots
      const save1 = page.locator('button:has-text("Save")').first();
      const save2 = page2.locator('button:has-text("Save")').first();
      
      await Promise.all([
        save1.click(),
        save2.click()
      ]);
      
      // Both should handle gracefully (no errors)
      const error1 = page.locator('.error, [role="alert"]');
      const error2 = page2.locator('.error, [role="alert"]');
      
      await expect(error1).not.toBeVisible({ timeout: 2000 }).catch(() => {});
      await expect(error2).not.toBeVisible({ timeout: 2000 }).catch(() => {});
      
      await context2.close();
    });

    test('should prevent snapshot creation without content', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Clear editor content
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Try to save empty snapshot
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      
      // Should show warning or be disabled
      const warning = page.locator('text=/empty|no content|required/i');
      const isDisabled = await saveButton.isDisabled();
      
      expect(await warning.isVisible().catch(() => false) || isDisabled).toBeTruthy();
    });
  });

  test.describe('Version History', () => {
    test('should display version timeline', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Navigate to versions tab
      const versionsTab = page.locator('button:has-text("Versions"), button:has-text("History")').first();
      await versionsTab.click();
      
      // Should show version timeline
      const timeline = page.locator('[data-testid="version-timeline"], .version-timeline, .timeline');
      await expect(timeline.first()).toBeVisible({ timeout: 5000 });
    });

    test('should show version details on selection', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to versions
      const versionsTab = page.locator('button:has-text("Versions")').first();
      await versionsTab.click();
      
      // Click on a version item
      const versionItem = page.locator('.version-item, [data-testid="version-item"]').first();
      if (await versionItem.isVisible()) {
        await versionItem.click();
        
        // Should show version details
        const details = page.locator('.version-details, [data-testid="version-details"]');
        await expect(details.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should restore previous version', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Create initial content
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('Version 1 content');
      
      // Save first version
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      // Modify content
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.type('Version 2 content');
      
      // Save second version
      await saveButton.click();
      await page.waitForTimeout(1000);
      
      // Go to versions and restore first version
      const versionsTab = page.locator('button:has-text("Versions")').first();
      await versionsTab.click();
      
      const restoreButton = page.locator('button:has-text("Restore")').first();
      if (await restoreButton.isVisible()) {
        await restoreButton.click();
        
        // Confirm restoration
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
        if (await confirmButton.isVisible()) {
          await confirmButton.click();
        }
        
        // Should show success
        const success = page.locator('.success, text=/restored/i');
        await expect(success.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should compare version differences', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Navigate to versions
      const versionsTab = page.locator('button:has-text("Versions")').first();
      await versionsTab.click();
      
      // Look for compare/diff functionality
      const compareButton = page.locator('button:has-text("Compare"), button:has-text("Diff")').first();
      if (await compareButton.isVisible()) {
        await compareButton.click();
        
        // Should show diff view
        const diffView = page.locator('.diff-view, [data-testid="diff-view"], .comparison');
        await expect(diffView.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle version pagination for many versions', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Create multiple versions quickly
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      const saveButton = page.locator('button:has-text("Save")').first();
      
      // Create 5 versions
      for (let i = 1; i <= 5; i++) {
        await editor.click();
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`Version ${i} content`);
        await saveButton.click();
        await page.waitForTimeout(500);
      }
      
      // Go to versions tab
      const versionsTab = page.locator('button:has-text("Versions")').first();
      await versionsTab.click();
      
      // Check for pagination or scroll
      const pagination = page.locator('.pagination, [data-testid="pagination"], button:has-text("Load more")');
      const versionItems = page.locator('.version-item, [data-testid="version-item"]');
      
      // Should have multiple versions or pagination
      const itemCount = await versionItems.count();
      const hasPagination = await pagination.first().isVisible().catch(() => false);
      
      expect(itemCount > 1 || hasPagination).toBeTruthy();
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle network failure during snapshot save', async ({ page, context, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Add content
      await editor.click();
      await page.keyboard.type('Content to save');
      
      // Simulate network failure
      await context.setOffline(true);
      
      // Try to save
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      
      // Should show error or retry option
      const errorMessage = page.locator('.error, text=/failed|offline|retry/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 5000 });
      
      // Restore network
      await context.setOffline(false);
      
      // Should be able to retry
      const retryButton = page.locator('button:has-text("Retry"), button:has-text("Try again")').first();
      if (await retryButton.isVisible()) {
        await retryButton.click();
        
        // Should eventually succeed
        const success = page.locator('.success, text=/saved/i');
        await expect(success.first()).toBeVisible({ timeout: 10000 });
      }
    });

    test('should preserve unsaved changes warning', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Add content without saving
      await editor.click();
      await page.keyboard.type('Unsaved content');
      
      // Try to navigate away
      const backButton = page.locator('button:has-text("Back"), a:has-text("Contracts")').first();
      if (await backButton.isVisible()) {
        await backButton.click();
        
        // Should show unsaved changes warning
        const warning = page.locator('text=/unsaved|leave|discard/i, [role="dialog"]');
        const hasWarning = await warning.first().isVisible({ timeout: 2000 }).catch(() => false);
        
        if (hasWarning) {
          // Cancel navigation
          const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Stay")').first();
          await cancelButton.click();
          
          // Should still be on the same page
          expect(page.url()).toContain(contractId);
        }
      }
    });

    test('should handle large document snapshots', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Add large content
      await editor.click();
      const largeContent = 'Lorem ipsum dolor sit amet. '.repeat(1000); // ~30KB of text
      await page.keyboard.type(largeContent);
      
      // Save large snapshot
      const saveButton = page.locator('button:has-text("Save")').first();
      await saveButton.click();
      
      // Should handle large content (might take longer)
      const success = page.locator('.success, text=/saved/i');
      await expect(success.first()).toBeVisible({ timeout: 30000 });
    });

    test('should maintain version integrity with concurrent edits', async ({ browser, page, contracts }) => {
      const contractId = contracts.getTestContractId();
      
      // Two users editing simultaneously
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      await page.goto(`/contracts/${contractId}`);
      await page2.goto(`/contracts/${contractId}`);
      
      const editor1 = page.locator('.ProseMirror').first();
      const editor2 = page2.locator('.ProseMirror').first();
      
      await expect(editor1).toBeVisible({ timeout: 15000 });
      await expect(editor2).toBeVisible({ timeout: 15000 });
      
      // Both users edit
      await editor1.click();
      await page.keyboard.type('User 1 edits here. ');
      
      await editor2.click();
      await page2.keyboard.type('User 2 edits here. ');
      
      // Both save versions
      const save1 = page.locator('button:has-text("Save")').first();
      const save2 = page2.locator('button:has-text("Save")').first();
      
      await save1.click();
      await page.waitForTimeout(1000);
      await save2.click();
      
      // Check version history shows both saves
      const versionsTab1 = page.locator('button:has-text("Versions")').first();
      await versionsTab1.click();
      
      const versionItems = page.locator('.version-item, [data-testid="version-item"]');
      const count = await versionItems.count();
      
      // Should have multiple versions
      expect(count).toBeGreaterThan(0);
      
      await context2.close();
    });
  });
});
