#!/usr/bin/env node

// Test script to verify the contract creation fix
// Run with: node test-contract-fix.js

async function testContractCreation() {
  const apiUrl = 'http://localhost:3000/api/contracts';
  
  // Test data
  const testContract = {
    title: 'Test Contract with Description',
    description: 'This is a test description to verify the metadata fix works correctly',
    status: 'draft'
  };

  console.log('Testing contract creation with description...');
  console.log('Request body:', JSON.stringify(testContract, null, 2));

  try {
    // First, we need to get an auth token
    // For this test, we'll assume you're already logged in
    // In a real test, you'd need to authenticate first
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Add auth header if needed
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify(testContract)
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error('❌ Error creating contract:');
      console.error('Status:', response.status);
      console.error('Response:', responseText);
      
      // Check if it's the old error
      if (responseText.includes("Could not find the 'description' column")) {
        console.error('\n⚠️  The error still mentions the description column!');
        console.error('The fix might not be deployed yet or there might be caching issues.');
      }
      return;
    }

    const data = JSON.parse(responseText);
    console.log('\n✅ Contract created successfully!');
    console.log('Response:', JSON.stringify(data, null, 2));
    
    // Verify the description was stored in metadata
    if (data.contract && data.contract.metadata) {
      if (data.contract.metadata.description === testContract.description) {
        console.log('\n✅ Description correctly stored in metadata!');
      } else {
        console.log('\n⚠️  Description in metadata doesn\'t match:');
        console.log('Expected:', testContract.description);
        console.log('Got:', data.contract.metadata.description);
      }
    } else {
      console.log('\n⚠️  No metadata field found in response');
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testContractCreation().then(() => {
  console.log('\nTest completed');
}).catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
