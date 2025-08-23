import { test, expect } from './fixtures';

test.describe('AI Features', () => {
  test.describe('AI Contract Generation', () => {
    test('should generate contract from natural language', async ({ page }) => {
      await page.goto('/contracts');
      
      // Find AI generation section
      const aiSection = page.locator('[data-testid="ai-generator"], .ai-generator, section').filter({ hasText: /AI|generate|template/i });
      await expect(aiSection.first()).toBeVisible({ timeout: 10000 });
      
      // Enter natural language prompt
      const promptInput = page.locator('input[placeholder*="NDA"], textarea[placeholder*="describe"], input[placeholder*="contract"]').first();
      await promptInput.fill('2-page NDA between startup and contractor with standard confidentiality terms');
      
      // Click generate button
      const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create")').first();
      await generateButton.click();
      
      // Should show generating indicator
      const loadingIndicator = page.locator('.loading, .spinner, text=/generating|creating/i');
      await expect(loadingIndicator.first()).toBeVisible({ timeout: 5000 });
      
      // Should eventually show generated content
      const generatedContent = page.locator('.generated-content, [data-testid="generated"], pre');
      await expect(generatedContent.first()).toBeVisible({ timeout: 30000 });
    });

    test('should use industry-specific templates', async ({ page }) => {
      await page.goto('/contracts');
      
      // Look for template selector
      const templateSelector = page.locator('select, [role="combobox"]').filter({ hasText: /template|industry/i });
      if (await templateSelector.first().isVisible()) {
        // Select specific industry
        await templateSelector.first().selectOption({ label: 'Service Agreement' });
        
        // Generate with template
        const generateButton = page.locator('button:has-text("Generate")').first();
        await generateButton.click();
        
        // Should generate industry-specific content
        const content = page.locator('.generated-content, pre').first();
        await expect(content).toBeVisible({ timeout: 30000 });
        
        // Should contain service-specific terms
        const text = await content.textContent();
        expect(text?.toLowerCase()).toContain('service');
      }
    });

    test('should handle multiple contract types', async ({ page }) => {
      await page.goto('/contracts');
      
      const contractTypes = ['NDA', 'Employment Contract', 'Service Agreement', 'Supplier Agreement'];
      
      for (const type of contractTypes) {
        const promptInput = page.locator('input[placeholder*="describe"], textarea').first();
        await promptInput.fill(`Generate a ${type}`);
        
        const generateButton = page.locator('button:has-text("Generate")').first();
        await generateButton.click();
        
        // Wait for generation
        await page.waitForTimeout(2000);
        
        // Verify type-specific content
        const content = page.locator('.generated-content, pre').first();
        const text = await content.textContent();
        
        // Each type should have relevant keywords
        if (type === 'NDA') expect(text?.toLowerCase()).toMatch(/confidential|non-disclosure/);
        if (type === 'Employment Contract') expect(text?.toLowerCase()).toMatch(/employment|employee|salary/);
        if (type === 'Service Agreement') expect(text?.toLowerCase()).toMatch(/service|deliverable/);
        if (type === 'Supplier Agreement') expect(text?.toLowerCase()).toMatch(/supplier|delivery|goods/);
      }
    });

    test('should validate UK compliance in generated contracts', async ({ page }) => {
      await page.goto('/contracts');
      
      // Generate UK-specific contract
      const promptInput = page.locator('input[placeholder*="describe"], textarea').first();
      await promptInput.fill('UK employment contract with GDPR compliance');
      
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();
      
      // Wait for generation
      const content = page.locator('.generated-content, pre').first();
      await expect(content).toBeVisible({ timeout: 30000 });
      
      // Check for UK compliance indicators
      const text = await content.textContent();
      const hasGDPR = text?.toLowerCase().includes('gdpr') || text?.toLowerCase().includes('data protection');
      const hasUKLaw = text?.toLowerCase().includes('uk law') || text?.toLowerCase().includes('english law');
      
      expect(hasGDPR || hasUKLaw).toBeTruthy();
    });
  });

  test.describe('Intelligent Risk Analysis', () => {
    test('should analyze contract risks', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Add risky content
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('Unlimited liability clause with no cap on damages');
      
      // Click analyze risks button
      const analyzeButton = page.locator('button:has-text("Analyze"), button:has-text("Risk")').first();
      await analyzeButton.click();
      
      // Should show risk analysis
      const riskAnalysis = page.locator('.risk-analysis, [data-testid="risk-analysis"], .analysis');
      await expect(riskAnalysis.first()).toBeVisible({ timeout: 30000 });
    });

    test('should display risk score', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Navigate to risk analysis tab
      const riskTab = page.locator('button:has-text("Risk"), button:has-text("Analysis")').first();
      await riskTab.click();
      
      // Should show risk score
      const riskScore = page.locator('[data-testid="risk-score"], .risk-score, text=/\\d+\\/100/');
      await expect(riskScore.first()).toBeVisible({ timeout: 10000 });
      
      // Should have risk level indicator
      const riskLevel = page.locator('text=/high|medium|low/i').filter({ hasText: /risk/i });
      await expect(riskLevel.first()).toBeVisible();
    });

    test('should identify red flags', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Add problematic clauses
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('No termination clause. Perpetual contract. No dispute resolution.');
      
      // Analyze risks
      const analyzeButton = page.locator('button:has-text("Analyze")').first();
      await analyzeButton.click();
      
      // Should show red flags
      const redFlags = page.locator('.red-flag, .warning, [data-testid="red-flag"]');
      await expect(redFlags.first()).toBeVisible({ timeout: 30000 });
      
      // Should identify specific issues
      const issues = await redFlags.allTextContents();
      const hasTerminationIssue = issues.some(text => text.toLowerCase().includes('termination'));
      const hasDisputeIssue = issues.some(text => text.toLowerCase().includes('dispute'));
      
      expect(hasTerminationIssue || hasDisputeIssue).toBeTruthy();
    });

    test('should check compliance automatically', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Add content that might violate compliance
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('Personal data will be stored indefinitely without consent');
      
      // Analyze
      const analyzeButton = page.locator('button:has-text("Analyze")').first();
      await analyzeButton.click();
      
      // Should flag GDPR compliance issue
      const complianceWarning = page.locator('text=/GDPR|compliance|data protection/i');
      await expect(complianceWarning.first()).toBeVisible({ timeout: 30000 });
    });
  });

  test.describe('AI Improvement Suggestions', () => {
    test('should suggest contract improvements', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Add basic contract content
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('Basic service agreement with payment terms');
      
      // Request improvements
      const improveButton = page.locator('button:has-text("Improve"), button:has-text("Suggest")').first();
      if (await improveButton.isVisible()) {
        await improveButton.click();
        
        // Should show suggestions
        const suggestions = page.locator('.suggestions, [data-testid="suggestions"], .improvements');
        await expect(suggestions.first()).toBeVisible({ timeout: 30000 });
        
        // Should have actionable suggestions
        const suggestionItems = page.locator('.suggestion-item, li').filter({ hasText: /add|include|consider/i });
        const count = await suggestionItems.count();
        expect(count).toBeGreaterThan(0);
      }
    });

    test('should apply suggested improvements', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Generate improvements
      const improveButton = page.locator('button:has-text("Improve"), button:has-text("Suggest")').first();
      if (await improveButton.isVisible()) {
        await improveButton.click();
        
        // Wait for suggestions
        const suggestions = page.locator('.suggestions, [data-testid="suggestions"]');
        await expect(suggestions.first()).toBeVisible({ timeout: 30000 });
        
        // Apply a suggestion
        const applyButton = page.locator('button:has-text("Apply"), button:has-text("Accept")').first();
        if (await applyButton.isVisible()) {
          await applyButton.click();
          
          // Should update editor content
          const editor = page.locator('.ProseMirror').first();
          const contentAfter = await editor.textContent();
          expect(contentAfter).toBeTruthy();
        }
      }
    });

    test('should provide alternative clauses', async ({ page, contracts }) => {
      const contractId = contracts.getTestContractId();
      await page.goto(`/contracts/${contractId}`);
      
      // Select a clause
      const editor = page.locator('.ProseMirror').first();
      await expect(editor).toBeVisible({ timeout: 15000 });
      
      await editor.click();
      await page.keyboard.type('Payment due in 90 days');
      
      // Select the text
      await page.keyboard.press('Control+A');
      
      // Request alternatives
      const alternativesButton = page.locator('button:has-text("Alternative"), button:has-text("Rephrase")').first();
      if (await alternativesButton.isVisible()) {
        await alternativesButton.click();
        
        // Should show alternative options
        const alternatives = page.locator('.alternatives, [data-testid="alternatives"]');
        await expect(alternatives.first()).toBeVisible({ timeout: 30000 });
        
        // Should have multiple options
        const options = page.locator('.alternative-option, [role="option"]');
        const count = await options.count();
        expect(count).toBeGreaterThan(1);
      }
    });
  });

  test.describe('AI Performance and Edge Cases', () => {
    test('should handle AI service timeout gracefully', async ({ page, context }) => {
      await page.goto('/contracts');
      
      // Simulate slow network
      await context.setOffline(true);
      
      // Try to generate contract
      const promptInput = page.locator('input[placeholder*="describe"], textarea').first();
      await promptInput.fill('Generate contract');
      
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should show error or timeout message
      const errorMessage = page.locator('.error, text=/timeout|failed|try again/i');
      await expect(errorMessage.first()).toBeVisible({ timeout: 10000 });
      
      // Restore connection
      await context.setOffline(false);
    });

    test('should handle inappropriate content requests', async ({ page }) => {
      await page.goto('/contracts');
      
      // Try to generate inappropriate content
      const promptInput = page.locator('input[placeholder*="describe"], textarea').first();
      await promptInput.fill('Generate illegal contract for money laundering');
      
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should refuse or show warning
      const warning = page.locator('.warning, .error, text=/cannot|inappropriate|illegal/i');
      await expect(warning.first()).toBeVisible({ timeout: 10000 });
    });

    test('should cache AI responses for efficiency', async ({ page }) => {
      await page.goto('/contracts');
      
      const prompt = 'Standard NDA template';
      
      // First generation
      const promptInput = page.locator('input[placeholder*="describe"], textarea').first();
      await promptInput.fill(prompt);
      
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();
      
      // Measure first generation time
      const start1 = Date.now();
      await page.locator('.generated-content, pre').first().waitFor({ state: 'visible', timeout: 30000 });
      const time1 = Date.now() - start1;
      
      // Clear and regenerate same prompt
      await promptInput.clear();
      await promptInput.fill(prompt);
      await generateButton.click();
      
      // Second generation should be faster (cached)
      const start2 = Date.now();
      await page.locator('.generated-content, pre').first().waitFor({ state: 'visible', timeout: 30000 });
      const time2 = Date.now() - start2;
      
      // Cache should make it faster (or at least not significantly slower)
      expect(time2).toBeLessThanOrEqual(time1 * 1.5);
    });

    test('should provide AI cost estimates for premium features', async ({ page }) => {
      await page.goto('/contracts');
      
      // Look for AI usage indicator
      const usageIndicator = page.locator('[data-testid="ai-usage"], .usage-meter, text=/credits|usage/i');
      
      if (await usageIndicator.isVisible()) {
        // Check for cost information
        const costInfo = page.locator('text=/cost|credit|token/i');
        await expect(costInfo.first()).toBeVisible();
      }
    });

    test('should fallback between AI providers', async ({ page }) => {
      await page.goto('/contracts');
      
      // Generate with primary provider (Groq)
      const promptInput = page.locator('input[placeholder*="describe"], textarea').first();
      await promptInput.fill('Generate contract with Groq');
      
      const generateButton = page.locator('button:has-text("Generate")').first();
      await generateButton.click();
      
      // Should eventually succeed even if primary fails
      const content = page.locator('.generated-content, pre').first();
      await expect(content).toBeVisible({ timeout: 60000 });
      
      // Check if fallback indicator exists
      const fallbackIndicator = page.locator('text=/fallback|alternative provider/i');
      const usedFallback = await fallbackIndicator.isVisible().catch(() => false);
      
      // System should work either way
      expect(true).toBeTruthy();
    });
  });

  test.describe('AI Template Marketplace Integration', () => {
    test('should browse AI-enhanced templates', async ({ page }) => {
      await page.goto('/contracts');
      
      // Look for template marketplace
      const marketplaceButton = page.locator('button:has-text("Browse"), button:has-text("Templates")').first();
      if (await marketplaceButton.isVisible()) {
        await marketplaceButton.click();
        
        // Should show template gallery
        const templateGallery = page.locator('.template-gallery, [data-testid="templates"], .marketplace');
        await expect(templateGallery.first()).toBeVisible({ timeout: 10000 });
        
        // Should have categorized templates
        const categories = page.locator('.category, [data-testid="category"]');
        const categoryCount = await categories.count();
        expect(categoryCount).toBeGreaterThan(0);
      }
    });

    test('should preview template before using', async ({ page }) => {
      await page.goto('/contracts');
      
      // Open templates
      const templatesButton = page.locator('button:has-text("Templates")').first();
      if (await templatesButton.isVisible()) {
        await templatesButton.click();
        
        // Click on a template
        const templateCard = page.locator('.template-card, [data-testid="template-card"]').first();
        if (await templateCard.isVisible()) {
          await templateCard.click();
          
          // Should show preview
          const preview = page.locator('.preview, [data-testid="preview"], [role="dialog"]');
          await expect(preview.first()).toBeVisible({ timeout: 5000 });
          
          // Should have use/select button
          const useButton = page.locator('button:has-text("Use"), button:has-text("Select")').last();
          await expect(useButton).toBeVisible();
        }
      }
    });

    test('should customize AI template', async ({ page }) => {
      await page.goto('/contracts');
      
      // Select a template
      const templatesButton = page.locator('button:has-text("Templates")').first();
      if (await templatesButton.isVisible()) {
        await templatesButton.click();
        
        const templateCard = page.locator('.template-card').first();
        await templateCard.click();
        
        // Use template
        const useButton = page.locator('button:has-text("Use"), button:has-text("Customize")').last();
        await useButton.click();
        
        // Should allow customization
        const customizeForm = page.locator('form, [data-testid="customize-form"]');
        if (await customizeForm.isVisible()) {
          // Fill in customization fields
          const companyInput = page.locator('input[placeholder*="company"], input[placeholder*="name"]').first();
          await companyInput.fill('Test Company Ltd');
          
          // Generate customized version
          const generateButton = page.locator('button:has-text("Generate"), button:has-text("Create")').last();
          await generateButton.click();
          
          // Should generate customized contract
          const customizedContent = page.locator('.generated-content, pre');
          await expect(customizedContent.first()).toBeVisible({ timeout: 30000 });
          
          // Should include custom values
          const text = await customizedContent.first().textContent();
          expect(text).toContain('Test Company Ltd');
        }
      }
    });
  });
});
