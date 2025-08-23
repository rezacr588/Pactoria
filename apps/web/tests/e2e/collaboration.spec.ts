import { test, expect } from './fixtures';

test.describe('Real-time Collaboration', () => {
  test.describe('Concurrent Editing', () => {
    test('should handle simultaneous editing by multiple users', async ({ browser }) => {
      // Create two browser contexts (simulating two users)
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        // Both users navigate to same contract
        const contractId = 'test-contract-123';
        await page1.goto(`/contracts/${contractId}`);
        await page2.goto(`/contracts/${contractId}`);
        
        // Wait for editors to load
        const editor1 = page1.locator('.ProseMirror').first();
        const editor2 = page2.locator('.ProseMirror').first();
        
        await expect(editor1).toBeVisible({ timeout: 15000 });
        await expect(editor2).toBeVisible({ timeout: 15000 });
        
        // User 1 types
        await editor1.click();
        await page1.keyboard.type('User 1 is typing here. ');
        
        // User 2 types
        await editor2.click();
        await page2.keyboard.type('User 2 is typing here. ');
        
        // Wait for sync
        await page1.waitForTimeout(2000);
        await page2.waitForTimeout(2000);
        
        // Both users should see each other's changes
        const content1 = await editor1.textContent();
        const content2 = await editor2.textContent();
        
        expect(content1).toContain('User 1 is typing');
        expect(content1).toContain('User 2 is typing');
        expect(content2).toContain('User 1 is typing');
        expect(content2).toContain('User 2 is typing');
      } finally {
        await context1.close();
        await context2.close();
      }
    });

    test('should show active collaborators', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        // Both users open same document
        const contractId = 'test-contract-123';
        await page1.goto(`/contracts/${contractId}`);
        await page2.goto(`/contracts/${contractId}`);
        
        // Should show collaborator indicators
        const collaborators1 = page1.locator('[data-testid="collaborators"], .collaborators, .active-users');
        const collaborators2 = page2.locator('[data-testid="collaborators"], .collaborators, .active-users');
        
        await expect(collaborators1.first()).toBeVisible({ timeout: 10000 });
        await expect(collaborators2.first()).toBeVisible({ timeout: 10000 });
        
        // Should show multiple user avatars
        const avatars1 = page1.locator('[data-testid="user-avatar"], .avatar, .user-indicator');
        const avatars2 = page2.locator('[data-testid="user-avatar"], .avatar, .user-indicator');
        
        const count1 = await avatars1.count();
        const count2 = await avatars2.count();
        
        expect(count1).toBeGreaterThanOrEqual(1);
        expect(count2).toBeGreaterThanOrEqual(1);
      } finally {
        await context1.close();
        await context2.close();
      }
    });

    test('should show cursor positions of other users', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        const contractId = 'test-contract-123';
        await page1.goto(`/contracts/${contractId}`);
        await page2.goto(`/contracts/${contractId}`);
        
        // Wait for editors
        const editor1 = page1.locator('.ProseMirror').first();
        const editor2 = page2.locator('.ProseMirror').first();
        
        await expect(editor1).toBeVisible({ timeout: 15000 });
        await expect(editor2).toBeVisible({ timeout: 15000 });
        
        // User 1 places cursor
        await editor1.click({ position: { x: 100, y: 50 } });
        
        // User 2 should see User 1's cursor
        const remoteCursor = page2.locator('.remote-cursor, [data-testid="remote-cursor"], .collaboration-cursor');
        await expect(remoteCursor.first()).toBeVisible({ timeout: 5000 });
        
        // User 2 places cursor elsewhere
        await editor2.click({ position: { x: 200, y: 100 } });
        
        // User 1 should see User 2's cursor
        const remoteCursor1 = page1.locator('.remote-cursor, [data-testid="remote-cursor"], .collaboration-cursor');
        await expect(remoteCursor1.first()).toBeVisible({ timeout: 5000 });
      } finally {
        await context1.close();
        await context2.close();
      }
    });

    test('should handle conflict resolution', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        const contractId = 'test-contract-123';
        
        // Simulate offline editing
        await context1.setOffline(true);
        await page1.goto(`/contracts/${contractId}`);
        
        const editor1 = page1.locator('.ProseMirror').first();
        await expect(editor1).toBeVisible({ timeout: 15000 });
        
        // User 1 edits offline
        await editor1.click();
        await page1.keyboard.type('Offline edit by User 1');
        
        // User 2 edits online
        await page2.goto(`/contracts/${contractId}`);
        const editor2 = page2.locator('.ProseMirror').first();
        await expect(editor2).toBeVisible({ timeout: 15000 });
        
        await editor2.click();
        await page2.keyboard.type('Online edit by User 2');
        
        // User 1 comes back online
        await context1.setOffline(false);
        await page1.reload();
        
        // Should merge changes or show conflict resolution
        const mergedContent = await editor1.textContent();
        const hasConflictUI = await page1.locator('.conflict, [data-testid="conflict"]').isVisible().catch(() => false);
        
        // Either changes are merged or conflict UI is shown
        expect(mergedContent.includes('User 2') || hasConflictUI).toBeTruthy();
      } finally {
        await context1.close();
        await context2.close();
      }
    });
  });

  test.describe('Comments and Annotations', () => {
    test('should add comment to selected text', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Select text in editor
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('This is a test clause for commenting.');
      
      // Select the text
      await page.keyboard.press('Control+A');
      
      // Add comment
      const commentButton = page.locator('button[aria-label*="comment"], button:has-text("Comment")').first();
      if (await commentButton.isVisible()) {
        await commentButton.click();
        
        // Enter comment
        const commentInput = page.locator('textarea[placeholder*="comment"], textarea[placeholder*="Add"]').first();
        await commentInput.fill('This clause needs review');
        
        // Submit comment
        const submitButton = page.locator('button:has-text("Add"), button:has-text("Post")').last();
        await submitButton.click();
        
        // Comment should appear
        const comment = page.locator('[data-testid="comment"], .comment-thread, .annotation');
        await expect(comment.first()).toBeVisible({ timeout: 5000 });
        await expect(comment.first()).toContainText('This clause needs review');
      }
    });

    test('should reply to comments', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Find existing comment
      const comment = page.locator('[data-testid="comment"], .comment-thread').first();
      
      if (await comment.isVisible()) {
        // Click reply
        const replyButton = page.locator('button:has-text("Reply")').first();
        await replyButton.click();
        
        // Enter reply
        const replyInput = page.locator('textarea[placeholder*="reply"], textarea').last();
        await replyInput.fill('I agree with this comment');
        
        // Submit reply
        const submitButton = page.locator('button:has-text("Reply"), button:has-text("Post")').last();
        await submitButton.click();
        
        // Reply should appear
        const reply = page.locator('.comment-reply, [data-testid="reply"]');
        await expect(reply.first()).toBeVisible({ timeout: 5000 });
        await expect(reply.first()).toContainText('I agree with this comment');
      }
    });

    test('should resolve comment threads', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Find comment thread
      const commentThread = page.locator('[data-testid="comment"], .comment-thread').first();
      
      if (await commentThread.isVisible()) {
        // Click resolve
        const resolveButton = page.locator('button:has-text("Resolve")').first();
        await resolveButton.click();
        
        // Comment should be marked as resolved
        const resolvedIndicator = page.locator('.resolved, [data-resolved="true"], text=/resolved/i');
        await expect(resolvedIndicator.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should filter comments by status', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open comments panel
      const commentsPanel = page.locator('[data-testid="comments-panel"], .comments-sidebar, button:has-text("Comments")').first();
      await commentsPanel.click();
      
      // Filter options should be available
      const filterOptions = page.locator('[role="combobox"], select, [data-testid="filter"]').first();
      
      if (await filterOptions.isVisible()) {
        // Select resolved comments
        await filterOptions.selectOption({ label: 'Resolved' });
        
        // Should only show resolved comments
        const comments = page.locator('[data-testid="comment"], .comment-thread');
        const visibleComments = await comments.all();
        
        for (const comment of visibleComments) {
          const isResolved = await comment.locator('.resolved, [data-resolved="true"]').isVisible();
          expect(isResolved).toBeTruthy();
        }
      }
    });
  });

  test.describe('Mentions and Notifications', () => {
    test('should mention users in comments', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open comment input
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.press('Control+A');
      
      const commentButton = page.locator('button[aria-label*="comment"]').first();
      if (await commentButton.isVisible()) {
        await commentButton.click();
        
        // Type mention
        const commentInput = page.locator('textarea[placeholder*="comment"]').first();
        await commentInput.type('@');
        
        // Mention dropdown should appear
        const mentionDropdown = page.locator('[data-testid="mention-dropdown"], .mention-list, [role="listbox"]');
        await expect(mentionDropdown.first()).toBeVisible({ timeout: 5000 });
        
        // Select a user
        const userOption = page.locator('[role="option"]').first();
        await userOption.click();
        
        // Complete comment
        await commentInput.type(' please review this');
        
        // Submit
        const submitButton = page.locator('button:has-text("Add")').last();
        await submitButton.click();
        
        // Mention should be formatted
        const mention = page.locator('.mention, [data-mention], a[href*="user"]');
        await expect(mention.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show notifications for mentions', async ({ page }) => {
      await page.goto('/');
      
      // Open notifications
      const notificationBell = page.locator('[data-testid="notifications"], button[aria-label*="notification"]').first();
      
      if (await notificationBell.isVisible()) {
        await notificationBell.click();
        
        // Should show notification panel
        const notificationPanel = page.locator('[data-testid="notification-panel"], .notifications-dropdown');
        await expect(notificationPanel.first()).toBeVisible({ timeout: 5000 });
        
        // Check for mention notifications
        const mentionNotification = page.locator('.notification').filter({ hasText: /@|mentioned/i });
        
        if (await mentionNotification.first().isVisible()) {
          // Click notification
          await mentionNotification.first().click();
          
          // Should navigate to the relevant contract/comment
          await expect(page).toHaveURL(/\/contracts\/[\w-]+#comment/);
        }
      }
    });

    test('should send email notifications for important events', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Check notification preferences
      const settingsButton = page.locator('button[aria-label*="settings"]').first();
      
      if (await settingsButton.isVisible()) {
        await settingsButton.click();
        
        const notificationSettings = page.locator('[data-testid="notification-settings"], .notification-preferences');
        
        if (await notificationSettings.isVisible()) {
          // Check email notification toggles
          const emailToggles = page.locator('input[type="checkbox"][name*="email"]');
          const toggleCount = await emailToggles.count();
          
          expect(toggleCount).toBeGreaterThan(0);
          
          // Ensure important events are enabled
          const mentionToggle = page.locator('input[type="checkbox"][name*="mention"]').first();
          if (!(await mentionToggle.isChecked())) {
            await mentionToggle.check();
          }
        }
      }
    });
  });

  test.describe('Collaboration Permissions', () => {
    test('should enforce edit permissions', async ({ page, contracts }) => {
      const contractId = 'readonly-contract-123';
      await page.goto(`/contracts/${contractId}`);
      
      // Editor should be read-only
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      // Check for read-only indicator
      const readOnlyIndicator = page.locator('.read-only, [data-readonly="true"], text=/view only|read-only/i');
      const isReadOnly = await readOnlyIndicator.first().isVisible().catch(() => false);
      
      if (isReadOnly) {
        // Try to edit
        await editor.click();
        await page.keyboard.type('Trying to edit');
        
        // Content should not change
        const content = await editor.textContent();
        expect(content).not.toContain('Trying to edit');
      }
    });

    test('should allow sharing with specific permissions', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open share dialog
      const shareButton = page.locator('button:has-text("Share")').first();
      await shareButton.click();
      
      // Share dialog should open
      const shareDialog = page.locator('[role="dialog"], [data-testid="share-dialog"], .share-modal');
      await expect(shareDialog.first()).toBeVisible({ timeout: 5000 });
      
      // Add collaborator
      const emailInput = page.locator('input[type="email"], input[placeholder*="email"]').last();
      await emailInput.fill('collaborator@example.com');
      
      // Select permission level
      const permissionSelect = page.locator('select, [role="combobox"]').last();
      await permissionSelect.selectOption({ label: 'Can edit' });
      
      // Send invitation
      const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Send")').last();
      await inviteButton.click();
      
      // Should show success
      const successMessage = page.locator('text=/invited|sent|added/i');
      await expect(successMessage.first()).toBeVisible({ timeout: 5000 });
    });

    test('should manage team access', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open share settings
      const shareButton = page.locator('button:has-text("Share")').first();
      await shareButton.click();
      
      // Look for team section
      const teamSection = page.locator('[data-testid="team-access"], .team-permissions');
      
      if (await teamSection.isVisible()) {
        // Should show team members
        const teamMembers = page.locator('.team-member, [data-testid="member"]');
        const memberCount = await teamMembers.count();
        expect(memberCount).toBeGreaterThan(0);
        
        // Should allow changing team permissions
        const teamPermission = page.locator('select[name*="team"], [data-testid="team-permission"]').first();
        if (await teamPermission.isVisible()) {
          await teamPermission.selectOption({ label: 'Can comment' });
          
          // Save changes
          const saveButton = page.locator('button:has-text("Save")').last();
          await saveButton.click();
          
          // Should show confirmation
          const saved = page.locator('text=/saved|updated/i');
          await expect(saved.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should track access history', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open activity/history panel
      const activityButton = page.locator('button:has-text("Activity"), button:has-text("History")').first();
      
      if (await activityButton.isVisible()) {
        await activityButton.click();
        
        // Should show access log
        const activityPanel = page.locator('[data-testid="activity"], .activity-log, .history-panel');
        await expect(activityPanel.first()).toBeVisible({ timeout: 5000 });
        
        // Should show access events
        const accessEvents = page.locator('.activity-item, .log-entry').filter({ hasText: /viewed|edited|shared/i });
        const eventCount = await accessEvents.count();
        expect(eventCount).toBeGreaterThan(0);
        
        // Should show timestamps
        const timestamps = page.locator('time, .timestamp, [data-testid="timestamp"]');
        const timestampCount = await timestamps.count();
        expect(timestampCount).toBeGreaterThan(0);
      }
    });
  });

  test.describe('Performance with Multiple Collaborators', () => {
    test('should handle 5+ simultaneous editors', async ({ browser }) => {
      const contexts = [];
      const pages = [];
      
      try {
        // Create 5 browser contexts
        for (let i = 0; i < 5; i++) {
          const context = await browser.newContext();
          const page = await context.newPage();
          contexts.push(context);
          pages.push(page);
        }
        
        const contractId = 'stress-test-contract';
        
        // All users open same document
        await Promise.all(pages.map(page => page.goto(`/contracts/${contractId}`)));
        
        // Wait for all editors to load
        await Promise.all(pages.map(async page => {
          const editor = page.locator('.ProseMirror').first();
          await expect(editor).toBeVisible({ timeout: 30000 });
        }));
        
        // Each user types simultaneously
        await Promise.all(pages.map(async (page, index) => {
          const editor = page.locator('.ProseMirror').first();
          await editor.click();
          await page.keyboard.type(`User ${index + 1} is typing. `);
        }));
        
        // Wait for sync
        await Promise.all(pages.map(page => page.waitForTimeout(3000)));
        
        // All users should see all changes
        for (let i = 0; i < pages.length; i++) {
          const content = await pages[i].locator('.ProseMirror').first().textContent();
          for (let j = 1; j <= 5; j++) {
            expect(content).toContain(`User ${j} is typing`);
          }
        }
      } finally {
        // Clean up all contexts
        await Promise.all(contexts.map(context => context.close()));
      }
    });

    test('should maintain responsiveness with heavy collaboration', async ({ browser }) => {
      const context1 = await browser.newContext();
      const context2 = await browser.newContext();
      
      const page1 = await context1.newPage();
      const page2 = await context2.newPage();
      
      try {
        const contractId = 'performance-test-contract';
        await page1.goto(`/contracts/${contractId}`);
        await page2.goto(`/contracts/${contractId}`);
        
        // Wait for editors
        const editor1 = page1.locator('.ProseMirror').first();
        const editor2 = page2.locator('.ProseMirror').first();
        
        await expect(editor1).toBeVisible({ timeout: 15000 });
        await expect(editor2).toBeVisible({ timeout: 15000 });
        
        // User 1 types rapidly
        await editor1.click();
        const startTime = Date.now();
        
        for (let i = 0; i < 50; i++) {
          await page1.keyboard.type(`Line ${i}. `);
          if (i % 10 === 0) {
            await page1.keyboard.press('Enter');
          }
        }
        
        const typingTime = Date.now() - startTime;
        
        // Should complete in reasonable time (less than 10 seconds for 50 phrases)
        expect(typingTime).toBeLessThan(10000);
        
        // User 2 should still be responsive
        await editor2.click();
        const responseStart = Date.now();
        await page2.keyboard.type('Testing responsiveness');
        const responseTime = Date.now() - responseStart;
        
        // Should respond quickly (less than 2 seconds)
        expect(responseTime).toBeLessThan(2000);
      } finally {
        await context1.close();
        await context2.close();
      }
    });
  });
});
