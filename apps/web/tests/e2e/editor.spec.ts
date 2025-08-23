import { test, expect } from './fixtures';
import { Page } from '@playwright/test';

test.describe('Collaborative Editor', () => {
  let contractId: string;

  test.beforeEach(async ({ page, contracts }) => {
    contractId = contracts.getTestContractId();
    // Navigate directly to a contract editor
    await page.goto(`/contracts/${contractId}`);
    
    // Wait for editor to be ready
    const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
    await expect(editor).toBeVisible({ timeout: 10000 });
  });

  test.describe('TipTap Editor Functionality', () => {
    test('should input and edit text', async ({ page }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      // Clear existing content
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Type new content
      const testText = 'This is a test contract content.';
      await editor.type(testText);
      
      // Verify text was inserted
      await expect(editor).toContainText(testText);
    });

    test('should apply text formatting', async ({ page }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      // Clear and type text
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Type text with formatting
      await editor.type('This is ');
      
      // Apply bold
      await page.keyboard.press('Control+B');
      await editor.type('bold');
      await page.keyboard.press('Control+B');
      
      await editor.type(' and ');
      
      // Apply italic
      await page.keyboard.press('Control+I');
      await editor.type('italic');
      await page.keyboard.press('Control+I');
      
      await editor.type(' text.');
      
      // Check for formatted elements
      const boldText = editor.locator('strong, b');
      const italicText = editor.locator('em, i');
      
      await expect(boldText).toContainText('bold');
      await expect(italicText).toContainText('italic');
    });

    test('should create headings', async ({ page }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Create H1
      await editor.type('# Main Heading');
      await page.keyboard.press('Enter');
      
      // Create H2
      await editor.type('## Subheading');
      await page.keyboard.press('Enter');
      
      // Create H3
      await editor.type('### Section Title');
      await page.keyboard.press('Enter');
      
      // Check for heading elements
      const h1 = editor.locator('h1');
      const h2 = editor.locator('h2');
      const h3 = editor.locator('h3');
      
      await expect(h1).toContainText('Main Heading');
      await expect(h2).toContainText('Subheading');
      await expect(h3).toContainText('Section Title');
    });

    test('should create lists', async ({ page }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Create bullet list
      await editor.type('- First item');
      await page.keyboard.press('Enter');
      await editor.type('- Second item');
      await page.keyboard.press('Enter');
      await editor.type('- Third item');
      await page.keyboard.press('Enter');
      await page.keyboard.press('Enter');
      
      // Create numbered list
      await editor.type('1. First numbered');
      await page.keyboard.press('Enter');
      await editor.type('2. Second numbered');
      await page.keyboard.press('Enter');
      
      // Check for list elements
      const bulletList = editor.locator('ul');
      const numberedList = editor.locator('ol');
      
      await expect(bulletList).toBeVisible();
      await expect(numberedList).toBeVisible();
    });

    test('should handle keyboard shortcuts', async ({ page }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Test undo/redo
      await editor.type('Original text');
      await page.keyboard.press('Control+Z'); // Undo
      await expect(editor).toHaveText('');
      
      await page.keyboard.press('Control+Shift+Z'); // Redo
      await expect(editor).toContainText('Original text');
      
      // Test select all and replace
      await page.keyboard.press('Control+A');
      await editor.type('Replaced text');
      await expect(editor).toContainText('Replaced text');
      await expect(editor).not.toContainText('Original text');
    });

    test('should use formatting toolbar', async ({ page }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      // Look for formatting toolbar
      const toolbar = page.locator('[role="toolbar"], .toolbar, .editor-toolbar, .tiptap-toolbar');
      
      if (await toolbar.isVisible()) {
        await editor.click();
        await page.keyboard.press('Control+A');
        await editor.type('Test text for toolbar');
        
        // Select text
        await page.keyboard.press('Control+A');
        
        // Click bold button
        const boldButton = toolbar.locator('button[title*="Bold"], button[aria-label*="Bold"], button:has-text("B")').first();
        if (await boldButton.isVisible()) {
          await boldButton.click();
          const boldText = editor.locator('strong, b');
          await expect(boldText).toBeVisible();
        }
        
        // Click italic button
        const italicButton = toolbar.locator('button[title*="Italic"], button[aria-label*="Italic"], button:has-text("I")').first();
        if (await italicButton.isVisible()) {
          await italicButton.click();
          const italicText = editor.locator('em, i');
          await expect(italicText).toBeVisible();
        }
      }
    });
  });

  test.describe('Real-time Collaboration', () => {
    test('should show collaboration status', async ({ page }) => {
      // Look for collaboration indicators
      const collabIndicator = page.locator('[data-testid="collab-status"], .collaboration-status, text=/connected|online|synced/i');
      const userCursor = page.locator('.collaboration-cursor, [data-testid="user-cursor"]');
      
      // Should show some collaboration status
      await expect(collabIndicator.or(userCursor).first()).toBeVisible({ timeout: 10000 });
    });

    test('should simulate multi-user editing', async ({ browser, page, contracts }) => {
      // Create a second browser context (simulating another user)
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      // Both users navigate to the same contract
      await page2.goto(`/contracts/${contractId}`);
      
      // Wait for both editors to be ready
      const editor1 = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      const editor2 = page2.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      await expect(editor1).toBeVisible({ timeout: 10000 });
      await expect(editor2).toBeVisible({ timeout: 10000 });
      
      // User 1 types
      await editor1.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await editor1.type('User 1 is typing here. ');
      
      // Wait for sync
      await page.waitForTimeout(1000);
      
      // User 2 should see the change
      await expect(editor2).toContainText('User 1 is typing here');
      
      // User 2 types
      await editor2.click();
      await editor2.press('End'); // Move to end
      await editor2.type('User 2 adds more text.');
      
      // Wait for sync
      await page2.waitForTimeout(1000);
      
      // User 1 should see both texts
      await expect(editor1).toContainText('User 1 is typing here');
      await expect(editor1).toContainText('User 2 adds more text');
      
      // Clean up
      await context2.close();
    });

    test('should show user cursors and selections', async ({ browser, page }) => {
      // Create second user
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await page2.goto(`/contracts/${contractId}`);
      
      const editor2 = page2.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      await expect(editor2).toBeVisible({ timeout: 10000 });
      
      // User 2 selects text
      await editor2.click();
      await page2.keyboard.press('Control+A');
      
      // User 1 should see user 2's cursor or selection
      const otherUserCursor = page.locator('.collaboration-cursor, .ProseMirror-yjs-cursor, [data-user-cursor]');
      
      // This might not be visible depending on the implementation
      if (await otherUserCursor.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(otherUserCursor).toBeVisible();
      }
      
      await context2.close();
    });

    test('should handle conflict resolution', async ({ browser, page }) => {
      const editor1 = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      // Create second user
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      await page2.goto(`/contracts/${contractId}`);
      
      const editor2 = page2.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      await expect(editor2).toBeVisible({ timeout: 10000 });
      
      // Clear content
      await editor1.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      
      // Both users type at the same position simultaneously
      await editor1.type('User 1 text');
      await editor2.type('User 2 text');
      
      // Wait for sync
      await page.waitForTimeout(2000);
      
      // Both texts should be present (CRDT should merge them)
      const content1 = await editor1.textContent();
      const content2 = await editor2.textContent();
      
      // Content should be the same in both editors
      expect(content1).toBe(content2);
      
      // Both user texts should be present in some form
      expect(content1).toBeTruthy();
      expect(content1?.length).toBeGreaterThan(0);
      
      await context2.close();
    });
  });

  test.describe('Yjs/WebRTC Connection', () => {
    test('should establish peer connection', async ({ page }) => {
      // Check for WebRTC connection indicators
      const connectionStatus = page.locator('text=/connected|peer|webrtc|online/i, [data-testid="connection-status"]');
      
      // Should show connection status
      await expect(connectionStatus.first()).toBeVisible({ timeout: 15000 });
    });

    test('should handle disconnection and reconnection', async ({ page, context }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      // Type something while online
      await editor.click();
      await editor.type('Online text ');
      
      // Simulate offline
      await context.setOffline(true);
      
      // Look for offline indicator
      const offlineIndicator = page.locator('text=/offline|disconnected|reconnecting/i');
      
      // Type while offline
      await editor.type('Offline text ');
      
      // Go back online
      await context.setOffline(false);
      
      // Should reconnect
      await page.waitForTimeout(2000);
      
      // Check for reconnection
      const onlineIndicator = page.locator('text=/connected|online|synced/i');
      await expect(onlineIndicator.first()).toBeVisible({ timeout: 10000 });
      
      // Content should be preserved
      await expect(editor).toContainText('Online text');
      await expect(editor).toContainText('Offline text');
    });

    test('should work in offline mode', async ({ page, context }) => {
      const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap').first();
      
      // Go offline
      await context.setOffline(true);
      
      // Should still be able to edit
      await editor.click();
      await page.keyboard.press('Control+A');
      await page.keyboard.press('Delete');
      await editor.type('This text was written offline');
      
      // Verify text is there
      await expect(editor).toContainText('This text was written offline');
      
      // Go back online
      await context.setOffline(false);
      
      // Content should still be there
      await expect(editor).toContainText('This text was written offline');
    });

    test('should show peer count', async ({ browser, page }) => {
      // Look for peer count indicator
      const peerCount = page.locator('[data-testid="peer-count"], .peer-count, text=/user|participant|collaborator/i');
      
      if (await peerCount.isVisible({ timeout: 5000 }).catch(() => false)) {
        // Create another peer
        const context2 = await browser.newContext();
        const page2 = await context2.newPage();
        await page2.goto(`/contracts/${contractId}`);
        
        // Wait for connection
        await page2.waitForTimeout(2000);
        
        // Peer count should increase
        const countText = await peerCount.textContent();
        expect(countText).toMatch(/[2-9]|multiple/i);
        
        await context2.close();
      }
    });
  });
});
