import { test as authTest, AuthFixture } from './auth.fixture';
import { test as contractTest, ContractFixture } from './contract.fixture';
import { mergeTests } from '@playwright/test';

// Merge all test fixtures
export const test = mergeTests(authTest, contractTest);

// Export types for use in tests
export type { AuthFixture, ContractFixture };

// Re-export expect for convenience
export { expect } from '@playwright/test';
