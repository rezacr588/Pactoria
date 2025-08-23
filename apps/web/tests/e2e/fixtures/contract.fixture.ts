import { test as base } from '@playwright/test';
import { faker } from '@faker-js/faker';

export interface Contract {
  id?: string;
  title: string;
  content: string;
  status: 'draft' | 'in_review' | 'approved' | 'rejected' | 'signed';
  metadata?: Record<string, any>;
}

export interface ContractFixture {
  createContract: (overrides?: Partial<Contract>) => Contract;
  createMultipleContracts: (count: number) => Contract[];
  generateContractContent: (type?: 'simple' | 'complex' | 'legal') => string;
  getTestContractId: () => string;
}

export const test = base.extend<{ contracts: ContractFixture }>({
  contracts: async ({}, use) => {
    // Generate a test contract
    const createContract = (overrides?: Partial<Contract>): Contract => {
      return {
        id: faker.string.uuid(),
        title: faker.company.catchPhrase(),
        content: generateContractContent('simple'),
        status: 'draft',
        metadata: {
          createdAt: new Date().toISOString(),
          version: 1,
        },
        ...overrides,
      };
    };

    // Generate multiple test contracts
    const createMultipleContracts = (count: number): Contract[] => {
      return Array.from({ length: count }, () => createContract());
    };

    // Generate different types of contract content
    const generateContractContent = (type: 'simple' | 'complex' | 'legal' = 'simple'): string => {
      switch (type) {
        case 'simple':
          return `
# Service Agreement

This agreement is between ${faker.company.name()} and ${faker.company.name()}.

## Terms
1. Service Period: ${faker.date.future().toLocaleDateString()}
2. Payment: $${faker.number.int({ min: 1000, max: 100000 })}
3. Deliverables: ${faker.lorem.paragraph()}

## Signatures
_____________________
Party A

_____________________
Party B
          `.trim();

        case 'complex':
          return `
# ${faker.company.catchPhrase()}

## 1. Introduction
${faker.lorem.paragraphs(2)}

## 2. Scope of Work
${faker.lorem.paragraphs(3)}

### 2.1 Deliverables
- ${faker.commerce.productName()}
- ${faker.commerce.productName()}
- ${faker.commerce.productName()}

## 3. Timeline
Start Date: ${faker.date.recent().toLocaleDateString()}
End Date: ${faker.date.future().toLocaleDateString()}

## 4. Payment Terms
Total: $${faker.number.int({ min: 10000, max: 500000 })}
${faker.lorem.paragraph()}

## 5. Terms and Conditions
${faker.lorem.paragraphs(4)}
          `.trim();

        case 'legal':
          return `
# MASTER SERVICE AGREEMENT

THIS AGREEMENT is entered into as of ${faker.date.recent().toLocaleDateString()} ("Effective Date")

BETWEEN:
${faker.company.name().toUpperCase()}, a corporation organized under the laws of ${faker.location.state()}
("Service Provider")

AND:
${faker.company.name().toUpperCase()}, a corporation organized under the laws of ${faker.location.state()}
("Client")

WHEREAS, ${faker.lorem.paragraph()}

NOW, THEREFORE, in consideration of the mutual covenants and agreements hereinafter set forth:

## ARTICLE I - DEFINITIONS
${faker.lorem.paragraphs(2)}

## ARTICLE II - SERVICES
${faker.lorem.paragraphs(3)}

## ARTICLE III - COMPENSATION
${faker.lorem.paragraphs(2)}

## ARTICLE IV - CONFIDENTIALITY
${faker.lorem.paragraphs(3)}

## ARTICLE V - TERMINATION
${faker.lorem.paragraphs(2)}

IN WITNESS WHEREOF, the parties have executed this Agreement.
          `.trim();

        default:
          return faker.lorem.paragraphs(3);
      }
    };

    // Get a consistent test contract ID for testing
    const getTestContractId = (): string => {
      // This can be a fixed UUID for testing or dynamically generated
      return process.env.TEST_CONTRACT_ID || '550e8400-e29b-41d4-a716-446655440000';
    };

    const contractFixture: ContractFixture = {
      createContract,
      createMultipleContracts,
      generateContractContent,
      getTestContractId,
    };

    await use(contractFixture);
  },
});

// Re-export expect for convenience
export { expect } from '@playwright/test';
