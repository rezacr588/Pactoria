# E2E Testing Guide for Pactoria Web

This guide covers end-to-end (E2E) testing setup, usage, and best practices for the Pactoria web application using Playwright.

## 📋 Table of Contents

- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Test Organization](#test-organization)
- [Debugging Failed Tests](#debugging-failed-tests)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [CI/CD Integration](#cicd-integration)

## Overview

Our E2E testing suite uses [Playwright](https://playwright.dev/) to test the Pactoria application across multiple browsers and devices. The tests cover:

- **Authentication flows** (login, signup, session management)
- **Contract management** (creation, navigation, permissions)
- **Collaborative editing** (TipTap editor, real-time sync)
- **Snapshot and versioning** 
- **Approval workflows**
- **Analytics dashboard**

## Setup Instructions

### Prerequisites

1. **Node.js 18+** installed
2. **Supabase project** configured (for auth and database)
3. **Environment variables** set up

### Initial Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Playwright browsers:**
   ```bash
   npx playwright install
   ```

3. **Configure environment variables:**
   
   Copy the test environment template:
   ```bash
   cp .env.test.local.example .env.test.local
   ```
   
   Edit `.env.test.local` with your test Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_test_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_test_supabase_anon_key
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=Test123456!
   ```

4. **Set up test database:**
   
   Create test users in your Supabase dashboard or use the Supabase CLI:
   ```sql
   -- Create test user
   INSERT INTO auth.users (email, encrypted_password, email_confirmed_at)
   VALUES ('test@example.com', crypt('Test123456!', gen_salt('bf')), now());
   ```

## Running Tests

### Run All Tests
```bash
npm run test:e2e
```

### Run Specific Test Files
```bash
npm run test:e2e tests/e2e/auth.spec.ts
npm run test:e2e tests/e2e/contracts.spec.ts
```

### Run Tests in UI Mode (Interactive)
```bash
npm run test:e2e:ui
```

### Run Tests in Debug Mode
```bash
npm run test:e2e:debug
```

### Run Tests in Headed Mode (See Browser)
```bash
npm run test:e2e:headed
```

### Run Tests for Specific Browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

### View Test Report
```bash
npm run test:e2e:report
```

## Writing Tests

### Test Structure

Tests are organized using Playwright's test structure:

```typescript
import { test, expect } from './fixtures';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
  });

  test('should do something', async ({ page }) => {
    // Test implementation
    await page.goto('/');
    await expect(page.locator('h1')).toBeVisible();
  });
});
```

### Using Custom Fixtures

We provide custom fixtures for common operations:

```typescript
import { test, expect } from './fixtures';

test('authenticated test', async ({ page, auth }) => {
  // Use auth fixture
  const user = auth.getTestUser();
  await auth.loginAs(user.email, user.password);
  
  // Test authenticated features
  await page.goto('/contracts');
});

test('contract test', async ({ page, contracts }) => {
  // Use contracts fixture
  const contract = contracts.createContract({
    title: 'Test Contract',
    status: 'draft'
  });
  
  // Test with generated contract data
});
```

### Page Object Pattern

For complex pages, use the Page Object pattern:

```typescript
// pages/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  async getErrorMessage() {
    return this.page.locator('.error-message').textContent();
  }
}

// In test file
import { LoginPage } from './pages/LoginPage';

test('login test', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.login('user@example.com', 'password');
});
```

## Test Organization

```
tests/e2e/
├── fixtures/           # Custom test fixtures
│   ├── auth.fixture.ts
│   ├── contract.fixture.ts
│   └── index.ts
├── helpers/           # Helper utilities
├── pages/            # Page objects (optional)
├── specs/            # Alternative test organization
├── auth.spec.ts      # Authentication tests
├── contracts.spec.ts # Contract management tests
├── editor.spec.ts    # Editor tests
├── smoke.spec.ts     # Quick smoke tests
└── README.md         # This file
```

## Debugging Failed Tests

### 1. Use Debug Mode
```bash
npm run test:e2e:debug
```
This opens the Playwright Inspector with step-by-step debugging.

### 2. Check Screenshots and Videos
Failed tests automatically capture screenshots and videos:
```
test-results/
├── test-name/
│   ├── screenshot.png
│   └── video.webm
```

### 3. Use Trace Viewer
```bash
npx playwright show-trace test-results/trace.zip
```

### 4. Add Debug Statements
```typescript
test('debug test', async ({ page }) => {
  await page.pause(); // Pauses execution
  
  // Log page content
  console.log(await page.content());
  
  // Take screenshot
  await page.screenshot({ path: 'debug.png' });
});
```

### 5. Slow Down Execution
```typescript
test.use({ 
  // Slow down by 1 second
  launchOptions: { slowMo: 1000 }
});
```

## Best Practices

### 1. Use Proper Selectors
```typescript
// ❌ Bad - brittle selectors
await page.click('.btn-3');
await page.click('div > span > button');

// ✅ Good - semantic selectors
await page.click('button[type="submit"]');
await page.click('[data-testid="save-button"]');
await page.click('button:has-text("Save")');
```

### 2. Wait for Elements Properly
```typescript
// ❌ Bad - fixed timeouts
await page.waitForTimeout(5000);

// ✅ Good - wait for specific conditions
await page.waitForSelector('[data-testid="loader"]', { state: 'hidden' });
await expect(page.locator('.success-message')).toBeVisible();
```

### 3. Handle Dynamic Content
```typescript
// Wait for network idle
await page.goto('/dashboard', { waitUntil: 'networkidle' });

// Wait for specific API calls
await page.waitForResponse(response => 
  response.url().includes('/api/contracts') && response.status() === 200
);
```

### 4. Isolate Tests
```typescript
test.describe('isolated tests', () => {
  test.beforeEach(async ({ page }) => {
    // Create fresh test data for each test
    const testId = Date.now();
    // Use unique identifiers
  });

  test.afterEach(async ({ page }) => {
    // Clean up test data
  });
});
```

### 5. Use Meaningful Assertions
```typescript
// ❌ Bad - generic assertions
expect(result).toBeTruthy();

// ✅ Good - specific assertions
expect(contractTitle).toBe('Service Agreement');
expect(errorMessage).toContain('Invalid credentials');
```

## Troubleshooting

### Common Issues and Solutions

#### 1. Tests Failing on CI but Passing Locally
- **Check environment variables** - Ensure CI has all required env vars
- **Browser versions** - Update Playwright: `npm update @playwright/test`
- **Timing issues** - Increase timeouts in CI configuration

#### 2. "Element not found" Errors
```typescript
// Add better waiting strategies
await page.waitForLoadState('networkidle');
await expect(element).toBeVisible({ timeout: 10000 });
```

#### 3. Authentication Issues
```typescript
// Ensure session is preserved
const context = await browser.newContext({
  storageState: 'auth.json'
});
```

#### 4. Flaky Tests
- Use `test.retry()` for known flaky tests
- Add proper wait conditions
- Check for race conditions
- Use `test.slow()` for complex tests

#### 5. WebRTC/Collaboration Tests Failing
```typescript
// Mock WebRTC for consistent testing
await page.addInitScript(() => {
  window.RTCPeerConnection = class MockRTC {
    // Mock implementation
  };
});
```

### Debug Commands

```bash
# Run single test
npx playwright test -g "test name"

# Run with specific browser
npx playwright test --browser=chromium

# Update snapshots
npx playwright test --update-snapshots

# Generate code
npx playwright codegen http://localhost:3000
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.TEST_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.TEST_SUPABASE_ANON_KEY }}
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### Local Pre-commit Hook

Install Husky:
```bash
npm install -D husky
npx husky init
```

Add pre-commit hook (`.husky/pre-commit`):
```bash
#!/bin/sh
npm run test:e2e -- tests/e2e/smoke.spec.ts
```

## Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

## Contributing

When adding new E2E tests:

1. Follow the existing test structure
2. Use custom fixtures when available
3. Add data-testid attributes to new UI elements
4. Document complex test scenarios
5. Ensure tests are independent and can run in parallel
6. Add appropriate error messages for assertions

## Questions?

For questions or issues with E2E testing, please:
1. Check this documentation
2. Review existing test examples
3. Check Playwright documentation
4. Open an issue in the repository
