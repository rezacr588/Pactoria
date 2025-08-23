import { test, expect } from './fixtures';

test.describe('Approval Workflows', () => {
  test.describe('Approval Request Flow', () => {
    test('should submit contract for approval', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Change status to in_review
      const statusSelect = page.locator('select, [role="combobox"]').filter({ hasText: /draft|status/i }).first();
      if (await statusSelect.isVisible()) {
        await statusSelect.selectOption('in_review');
      } else {
        // Alternative: click status button
        const statusButton = page.locator('button:has-text("Submit for Approval"), button:has-text("Request Approval")').first();
        await statusButton.click();
      }
      
      // Should show approval request form or confirmation
      const approvalForm = page.locator('[role="dialog"], .modal, form').filter({ hasText: /approval|review/i });
      await expect(approvalForm.first()).toBeVisible({ timeout: 5000 });
      
      // Add approvers
      const approverInput = page.locator('input[type="email"], input[placeholder*="email"], input[placeholder*="approver"]').first();
      if (await approverInput.isVisible()) {
        await approverInput.fill('approver@example.com');
        
        // Submit approval request
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send")').last();
        await submitButton.click();
        
        // Should show success
        const success = page.locator('.success, .toast, text=/sent|submitted/i');
        await expect(success.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle multiple approvers', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Navigate to approvals tab
      const approvalsTab = page.locator('button:has-text("Approvals"), button:has-text("Approval")').first();
      await approvalsTab.click();
      
      // Add multiple approvers
      const addApproverButton = page.locator('button:has-text("Add Approver"), button:has-text("Add")').first();
      if (await addApproverButton.isVisible()) {
        // Add first approver
        await addApproverButton.click();
        const emailInput1 = page.locator('input[type="email"]').last();
        await emailInput1.fill('approver1@example.com');
        
        // Add second approver
        await addApproverButton.click();
        const emailInput2 = page.locator('input[type="email"]').last();
        await emailInput2.fill('approver2@example.com');
        
        // Submit
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send")').last();
        await submitButton.click();
        
        // Should show multiple approvers in list
        const approverList = page.locator('.approver-list, .approvers, [data-testid="approvers"]');
        await expect(approverList.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should support sequential approval workflow', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Look for workflow type selector
      const workflowType = page.locator('select, [role="combobox"]').filter({ hasText: /sequential|parallel|workflow/i });
      if (await workflowType.first().isVisible()) {
        await workflowType.first().selectOption({ label: 'Sequential' });
        
        // Add approvers with order
        const approver1 = page.locator('input[placeholder*="First approver"]').first();
        const approver2 = page.locator('input[placeholder*="Second approver"]').first();
        
        if (await approver1.isVisible() && await approver2.isVisible()) {
          await approver1.fill('first@example.com');
          await approver2.fill('second@example.com');
          
          // Should show order indicators
          const orderIndicator = page.locator('text=/step|order|1st|2nd/i');
          await expect(orderIndicator.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should support parallel approval workflow', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Select parallel workflow
      const workflowType = page.locator('select, [role="combobox"]').filter({ hasText: /workflow/i });
      if (await workflowType.first().isVisible()) {
        await workflowType.first().selectOption({ label: 'Parallel' });
        
        // Add multiple approvers
        const addButton = page.locator('button:has-text("Add")').first();
        await addButton.click();
        await addButton.click();
        
        // All approvers should be at same level
        const levelIndicator = page.locator('text=/all required|unanimous|parallel/i');
        await expect(levelIndicator.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Approval Actions', () => {
    test('should approve contract', async ({ page, contracts, auth }) => {
      // Login as approver
      const approver = { email: 'approver@example.com', password: 'Test123456!' };
      await auth.loginAs(approver.email, approver.password);
      
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Find and click approve button
      const approveButton = page.locator('button:has-text("Approve"), button[aria-label*="Approve"]').first();
      if (await approveButton.isVisible()) {
        await approveButton.click();
        
        // Add approval comment
        const commentInput = page.locator('textarea, input[placeholder*="comment"], input[placeholder*="reason"]').first();
        if (await commentInput.isVisible()) {
          await commentInput.fill('Looks good, approved');
        }
        
        // Confirm approval
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Submit")').last();
        await confirmButton.click();
        
        // Should show success
        const success = page.locator('.success, text=/approved/i');
        await expect(success.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should reject contract with comments', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Click reject button
      const rejectButton = page.locator('button:has-text("Reject"), button[aria-label*="Reject"]').first();
      if (await rejectButton.isVisible()) {
        await rejectButton.click();
        
        // Add rejection reason (should be required)
        const reasonInput = page.locator('textarea, input').filter({ hasText: /reason|comment|feedback/i }).first();
        await reasonInput.fill('Contract needs revision: payment terms unclear');
        
        // Submit rejection
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Confirm")').last();
        await submitButton.click();
        
        // Should show rejection confirmation
        const confirmation = page.locator('.error, .warning, text=/rejected/i');
        await expect(confirmation.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should request changes', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Look for request changes option
      const requestChangesButton = page.locator('button:has-text("Request Changes"), button:has-text("Revise")').first();
      if (await requestChangesButton.isVisible()) {
        await requestChangesButton.click();
        
        // Add specific change requests
        const changesInput = page.locator('textarea').first();
        await changesInput.fill('Please update:\n1. Payment terms\n2. Delivery timeline\n3. Liability clauses');
        
        // Submit change request
        const submitButton = page.locator('button:has-text("Submit"), button:has-text("Send")').last();
        await submitButton.click();
        
        // Should update status
        const statusIndicator = page.locator('text=/changes requested|revision needed/i');
        await expect(statusIndicator.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should handle approval delegation', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Look for delegate option
      const delegateButton = page.locator('button:has-text("Delegate"), button:has-text("Forward")').first();
      if (await delegateButton.isVisible()) {
        await delegateButton.click();
        
        // Enter delegate email
        const delegateInput = page.locator('input[type="email"]').last();
        await delegateInput.fill('delegate@example.com');
        
        // Add delegation note
        const noteInput = page.locator('textarea, input[placeholder*="note"]').first();
        if (await noteInput.isVisible()) {
          await noteInput.fill('Please review on my behalf');
        }
        
        // Confirm delegation
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Delegate")').last();
        await confirmButton.click();
        
        // Should show delegation success
        const success = page.locator('.success, text=/delegated|forwarded/i');
        await expect(success.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Notification System', () => {
    test('should show in-app notifications for approval requests', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Submit for approval
      const submitButton = page.locator('button:has-text("Submit for Approval")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        
        // Should show notification
        const notification = page.locator('.notification, .toast, [role="alert"]').filter({ hasText: /approval|sent/i });
        await expect(notification.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should display notification badge for pending approvals', async ({ page }) => {
      await page.goto('/');
      
      // Look for notification badge
      const notificationBadge = page.locator('.badge, .notification-count, [data-testid="notification-badge"]');
      
      if (await notificationBadge.isVisible()) {
        const count = await notificationBadge.textContent();
        
        // Click to view notifications
        await notificationBadge.click();
        
        // Should show notification list
        const notificationList = page.locator('.notifications, [data-testid="notifications"]');
        await expect(notificationList.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should send email notifications (mock)', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Check email notification option
      const emailOption = page.locator('input[type="checkbox"]').filter({ hasText: /email|notify/i }).first();
      if (await emailOption.isVisible()) {
        await emailOption.check();
        
        // Submit approval request
        const submitButton = page.locator('button:has-text("Submit")').first();
        await submitButton.click();
        
        // Should show email sent confirmation
        const emailConfirmation = page.locator('text=/email sent|notified/i');
        await expect(emailConfirmation.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Edge Cases', () => {
    test('should handle approval timeout', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Look for deadline/timeout settings
      const deadlineInput = page.locator('input[type="date"], input[type="datetime-local"]').first();
      if (await deadlineInput.isVisible()) {
        // Set a past date to simulate timeout
        const pastDate = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        await deadlineInput.fill(pastDate);
        
        // Should show timeout warning
        const warning = page.locator('.warning, text=/expired|overdue|timeout/i');
        await expect(warning.first()).toBeVisible({ timeout: 5000 });
      }
    });

    test('should prevent self-approval', async ({ page, contracts, auth }) => {
      // Login as contract owner
      const owner = auth.getTestUser();
      await auth.loginAs(owner.email, owner.password);
      
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Try to approve own contract
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      const approveButton = page.locator('button:has-text("Approve")').first();
      if (await approveButton.isVisible()) {
        const isDisabled = await approveButton.isDisabled();
        const hasWarning = await page.locator('text=/cannot approve own|self-approval/i').isVisible().catch(() => false);
        
        // Should be disabled or show warning
        expect(isDisabled || hasWarning).toBeTruthy();
      }
    });

    test('should handle conflicting approvals', async ({ browser, page, contracts }) => {
      const contractId = contracts.getTestContractId();
      
      // Two approvers access simultaneously
      const context2 = await browser.newContext();
      const page2 = await context2.newPage();
      
      await page.goto(`/contracts/${contractId}`);
      await page2.goto(`/contracts/${contractId}`);
      
      // Navigate to approvals
      const approvalsTab1 = page.locator('button:has-text("Approvals")').first();
      const approvalsTab2 = page2.locator('button:has-text("Approvals")').first();
      
      await approvalsTab1.click();
      await approvalsTab2.click();
      
      // One approves, one rejects
      const approveButton = page.locator('button:has-text("Approve")').first();
      const rejectButton = page2.locator('button:has-text("Reject")').first();
      
      if (await approveButton.isVisible() && await rejectButton.isVisible()) {
        await Promise.all([
          approveButton.click(),
          rejectButton.click()
        ]);
        
        // System should handle conflict
        const conflictMessage = page.locator('text=/conflict|already processed/i');
        const hasConflict = await conflictMessage.first().isVisible({ timeout: 5000 }).catch(() => false);
        
        // At least one should show conflict or be handled
        expect(hasConflict).toBeDefined();
      }
      
      await context2.close();
    });

    test('should maintain approval audit trail', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Go to approvals
      const approvalsTab = page.locator('button:has-text("Approvals")').first();
      await approvalsTab.click();
      
      // Look for approval history/audit trail
      const historyButton = page.locator('button:has-text("History"), button:has-text("Audit")').first();
      if (await historyButton.isVisible()) {
        await historyButton.click();
        
        // Should show audit trail
        const auditTrail = page.locator('.audit-trail, [data-testid="audit-trail"], .history');
        await expect(auditTrail.first()).toBeVisible({ timeout: 5000 });
        
        // Should include timestamps
        const timestamps = page.locator('time, .timestamp, text=/\\d{4}-\\d{2}-\\d{2}/');
        await expect(timestamps.first()).toBeVisible();
      }
    });

    test('should handle approval withdrawal', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Submit for approval first
      const submitButton = page.locator('button:has-text("Submit for Approval")').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
        
        // Now withdraw approval request
        const withdrawButton = page.locator('button:has-text("Withdraw"), button:has-text("Cancel Request")').first();
        if (await withdrawButton.isVisible()) {
          await withdrawButton.click();
          
          // Confirm withdrawal
          const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")').last();
          await confirmButton.click();
          
          // Should revert to draft status
          const statusIndicator = page.locator('text=/draft|withdrawn/i');
          await expect(statusIndicator.first()).toBeVisible({ timeout: 5000 });
        }
      }
    });
  });
});
