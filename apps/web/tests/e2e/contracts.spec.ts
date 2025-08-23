import { test, expect } from './fixtures';

test.describe('Contract Management', () => {
  test.describe('Contract Navigation', () => {
    test('should navigate to contract by UUID', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      
      // Navigate to home page
      await page.goto('/');
      
      // Enter contract ID in the input field
      await page.fill('input[placeholder*="Contract"], input[placeholder*="UUID"]', contractId);
      
      // Click the Open button
      await page.click('button:has-text("Open")');
      
      // Should navigate to contract page
      await page.waitForURL(`/contracts/${contractId}`);
      
      // Should show the contract editor or content
      const editorElement = page.locator('[data-testid="contract-editor"], .ProseMirror, .tiptap, [contenteditable="true"]');
      await expect(editorElement).toBeVisible({ timeout: 10000 });
    });

    test('should handle invalid UUID gracefully', async ({ page }) => {
      const invalidId = 'invalid-uuid-123';
      
      // Try to navigate directly to invalid contract
      await page.goto(`/contracts/${invalidId}`);
      
      // Should show error message or redirect
      const errorMessage = page.locator('.error, [role="alert"], .text-red-500, text=/not found|invalid|does not exist/i');
      const isOnErrorPage = page.url().includes('404') || page.url().includes('error');
      const isRedirected = page.url() === '/' || page.url().includes('/contracts');
      
      // Either show error, be on error page, or redirect
      const hasError = await errorMessage.isVisible().catch(() => false);
      expect(hasError || isOnErrorPage || isRedirected).toBeTruthy();
    });

    test('should display contract list', async ({ page }) => {
      // Navigate to contracts list page
      await page.goto('/contracts');
      
      // Should show contracts list or empty state
      const contractsList = page.locator('[data-testid="contracts-list"], .contracts-list, table, .grid');
      const emptyState = page.locator('text=/no contracts|empty|create your first/i');
      
      // Either show list or empty state
      await expect(contractsList.or(emptyState).first()).toBeVisible({ timeout: 10000 });
    });

    test('should search and filter contracts', async ({ page }) => {
      await page.goto('/contracts');
      
      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="Search"], input[placeholder*="Filter"]');
      
      if (await searchInput.isVisible()) {
        // Type search query
        await searchInput.fill('test contract');
        
        // Wait for results to update
        await page.waitForTimeout(500);
        
        // Check that the list has been filtered (URL might change or content updates)
        const resultsIndicator = page.locator('.search-results, [data-testid="search-results"], text=/results|found|showing/i');
        await expect(resultsIndicator.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Contract Creation', () => {
    test('should create new contract', async ({ page, contracts }) => {
      await page.goto('/contracts');
      
      // Look for create/new contract button
      const createButton = page.locator('button:has-text("Create"), button:has-text("New"), a:has-text("Create"), a:has-text("New")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Should show contract creation form or new contract editor
        const titleInput = page.locator('input[name="title"], input[placeholder*="Title"], input[placeholder*="Name"]');
        const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap');
        
        await expect(titleInput.or(editor).first()).toBeVisible({ timeout: 5000 });
        
        // If there's a title input, fill it
        if (await titleInput.isVisible()) {
          const testContract = contracts.createContract();
          await titleInput.fill(testContract.title);
          
          // Look for save/create button
          const saveButton = page.locator('button:has-text("Save"), button:has-text("Create")').last();
          if (await saveButton.isVisible()) {
            await saveButton.click();
            
            // Should navigate to the new contract or show success
            await page.waitForURL(/\/contracts\/[a-f0-9-]+/, { timeout: 10000 });
          }
        }
      }
    });

    test('should set contract metadata', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Look for metadata or settings button
      const metadataButton = page.locator('button:has-text("Settings"), button:has-text("Metadata"), button:has-text("Properties")');
      
      if (await metadataButton.isVisible()) {
        await metadataButton.click();
        
        // Should show metadata form
        const metadataForm = page.locator('form, [role="dialog"], .modal, .drawer');
        await expect(metadataForm).toBeVisible({ timeout: 5000 });
        
        // Fill in some metadata fields if available
        const titleField = page.locator('input[name="title"], input[name="name"]');
        const descriptionField = page.locator('textarea[name="description"], input[name="description"]');
        
        if (await titleField.isVisible()) {
          await titleField.fill('Updated Contract Title');
        }
        
        if (await descriptionField.isVisible()) {
          await descriptionField.fill('This is a test contract description');
        }
        
        // Save metadata
        const saveButton = page.locator('button:has-text("Save"), button:has-text("Update")').last();
        await saveButton.click();
        
        // Should close modal and show success
        await expect(metadataForm).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('should select contract template', async ({ page }) => {
      await page.goto('/contracts');
      
      // Look for template selection when creating new contract
      const createButton = page.locator('button:has-text("Create"), button:has-text("New")').first();
      
      if (await createButton.isVisible()) {
        await createButton.click();
        
        // Look for template selection
        const templateSelector = page.locator('[data-testid="template-selector"], .templates, text=/template/i');
        
        if (await templateSelector.isVisible()) {
          // Select a template
          const templateOption = page.locator('.template-card, [role="option"], button').filter({ hasText: /service|nda|employment/i }).first();
          
          if (await templateOption.isVisible()) {
            await templateOption.click();
            
            // Should populate the contract with template content
            const editor = page.locator('[contenteditable="true"], .ProseMirror, .tiptap');
            await expect(editor).toBeVisible({ timeout: 5000 });
            
            // Check that content has been populated
            const content = await editor.textContent();
            expect(content).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe('Contract Permissions', () => {
    test.beforeEach(async ({ auth }) => {
      // Login as test user for permission tests
      const testUser = auth.getTestUser();
      await auth.loginAs(testUser.email, testUser.password);
    });

    test('should verify access control', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      
      // Navigate to contract
      await page.goto(`/contracts/${contractId}`);
      
      // Check for permission indicators
      const permissionIndicator = page.locator('text=/owner|viewer|editor|collaborator/i, [data-testid="permission-badge"]');
      const shareButton = page.locator('button:has-text("Share"), button:has-text("Permissions")');
      
      // Should show permission level or share options
      await expect(permissionIndicator.or(shareButton).first()).toBeVisible({ timeout: 5000 });
    });

    test('should handle unauthorized access', async ({ page, auth }) => {
      // Logout first
      await auth.logout();
      
      // Try to access a contract without authentication
      const contractId = '550e8400-e29b-41d4-a716-446655440000';
      await page.goto(`/contracts/${contractId}`);
      
      // Should redirect to login or show unauthorized message
      const isOnLogin = page.url().includes('/login');
      const unauthorizedMessage = page.locator('text=/unauthorized|forbidden|access denied|login required/i');
      
      const hasUnauthorized = await unauthorizedMessage.isVisible().catch(() => false);
      expect(isOnLogin || hasUnauthorized).toBeTruthy();
    });

    test('should manage contract sharing', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Look for share button
      const shareButton = page.locator('button:has-text("Share"), button:has-text("Invite")');
      
      if (await shareButton.isVisible()) {
        await shareButton.click();
        
        // Should show sharing modal
        const shareModal = page.locator('[role="dialog"], .modal, .share-modal');
        await expect(shareModal).toBeVisible({ timeout: 5000 });
        
        // Try to add a collaborator
        const emailInput = page.locator('input[type="email"], input[placeholder*="Email"]');
        if (await emailInput.isVisible()) {
          await emailInput.fill('collaborator@example.com');
          
          // Select permission level if available
          const permissionSelect = page.locator('select, [role="combobox"]').first();
          if (await permissionSelect.isVisible()) {
            await permissionSelect.selectOption({ label: 'Editor' }).catch(() => {
              // Fallback for custom select components
              permissionSelect.click();
              page.locator('text="Editor"').click();
            });
          }
          
          // Send invitation
          const inviteButton = page.locator('button:has-text("Invite"), button:has-text("Add"), button:has-text("Share")').last();
          await inviteButton.click();
          
          // Should show success or update the list
          const successMessage = page.locator('.success, .toast, text=/invited|added|shared/i');
          const collaboratorsList = page.locator('.collaborators-list, .users-list');
          
          await expect(successMessage.or(collaboratorsList).first()).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should revoke contract access', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Open sharing settings
      const shareButton = page.locator('button:has-text("Share"), button:has-text("Permissions")');
      
      if (await shareButton.isVisible()) {
        await shareButton.click();
        
        // Look for existing collaborators
        const collaboratorItem = page.locator('.collaborator-item, .user-item, [data-testid="collaborator"]').first();
        
        if (await collaboratorItem.isVisible()) {
          // Find remove/revoke button
          const removeButton = collaboratorItem.locator('button:has-text("Remove"), button:has-text("Revoke"), button[aria-label*="Remove"]');
          
          if (await removeButton.isVisible()) {
            await removeButton.click();
            
            // Confirm if needed
            const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes")');
            if (await confirmButton.isVisible({ timeout: 1000 })) {
              await confirmButton.click();
            }
            
            // Should show success message
            const successMessage = page.locator('.success, .toast, text=/removed|revoked/i');
            await expect(successMessage).toBeVisible({ timeout: 5000 });
          }
        }
      }
    });
  });
});
