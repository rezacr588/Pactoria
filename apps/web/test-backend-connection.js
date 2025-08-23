#!/usr/bin/env node

/**
 * Backend Connection Test Script
 * This script tests all critical backend connections and API endpoints
 * Run with: node test-backend-connection.js
 */

// Use native fetch (available in Node 18+)
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
const envPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Configuration
const BASE_URL = 'http://localhost:3000';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Test results tracking
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;
const results = [];

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function logTest(name, passed, details = '') {
  testsRun++;
  if (passed) {
    testsPassed++;
    log(`  ✅ ${name}`, colors.green);
  } else {
    testsFailed++;
    log(`  ❌ ${name}`, colors.red);
    if (details) {
      log(`     ${details}`, colors.yellow);
    }
  }
  results.push({ name, passed, details });
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Test Functions
async function testEnvironmentVariables() {
  log('\n📋 Testing Environment Variables', colors.cyan);
  
  logTest('NEXT_PUBLIC_SUPABASE_URL', !!SUPABASE_URL, 
    !SUPABASE_URL ? 'Missing in .env.local' : SUPABASE_URL);
  
  logTest('NEXT_PUBLIC_SUPABASE_ANON_KEY', !!SUPABASE_ANON_KEY,
    !SUPABASE_ANON_KEY ? 'Missing in .env.local' : 'Key found (hidden for security)');
  
  return !!SUPABASE_URL && !!SUPABASE_ANON_KEY;
}

async function testSupabaseConnection() {
  log('\n🔌 Testing Supabase Connection', colors.cyan);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logTest('Supabase Connection', false, 'Missing environment variables');
    return false;
  }

  try {
    // Test basic connection to Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    logTest('Supabase REST API', response.ok, 
      response.ok ? `Status: ${response.status}` : `Error: ${response.status}`);
    
    // Test auth endpoint
    const authResponse = await fetch(`${SUPABASE_URL}/auth/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    logTest('Supabase Auth Service', authResponse.ok,
      authResponse.ok ? 'Auth service healthy' : `Error: ${authResponse.status}`);
    
    return response.ok && authResponse.ok;
  } catch (error) {
    logTest('Supabase Connection', false, error.message);
    return false;
  }
}

async function testNextJSServer() {
  log('\n🚀 Testing Next.js Server', colors.cyan);
  
  try {
    const response = await fetch(BASE_URL);
    logTest('Next.js Server Running', response.ok,
      response.ok ? `Status: ${response.status}` : `Error: ${response.status}`);
    return response.ok;
  } catch (error) {
    logTest('Next.js Server Running', false, 
      'Server not running. Run "npm run dev" first');
    return false;
  }
}

async function testAPIEndpoints() {
  log('\n🔍 Testing API Endpoints', colors.cyan);
  
  const endpoints = [
    { path: '/api/auth', method: 'POST', body: { action: 'getSession' }, name: 'Auth API' },
    { path: '/api/contracts', method: 'GET', name: 'Contracts API' },
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      const options = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
        }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`${BASE_URL}${endpoint.path}`, options);
      const passed = response.status !== 404;
      
      logTest(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, passed,
        passed ? `Status: ${response.status}` : 'Endpoint not found');
      
      if (!passed) allPassed = false;
    } catch (error) {
      logTest(`${endpoint.name} (${endpoint.method} ${endpoint.path})`, false, error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testDatabaseTables() {
  log('\n📊 Testing Database Tables', colors.cyan);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logTest('Database Tables', false, 'Missing Supabase credentials');
    return false;
  }
  
  const tables = [
    'contracts',
    'contract_versions',
    'contract_approvals',
    'templates',
    'profiles'
  ];
  
  let allPassed = true;
  
  for (const table of tables) {
    try {
      const response = await fetch(
        `${SUPABASE_URL}/rest/v1/${table}?select=count`,
        {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Prefer': 'count=exact'
          }
        }
      );
      
      const passed = response.ok;
      let details = '';
      
      if (passed) {
        const count = response.headers.get('content-range');
        details = count ? `Count accessible` : 'Table accessible';
      } else if (response.status === 401) {
        details = 'RLS policy restricting access (expected)';
      } else {
        details = `Status: ${response.status}`;
      }
      
      logTest(`Table: ${table}`, passed || response.status === 401, details);
      
      if (!passed && response.status !== 401) allPassed = false;
    } catch (error) {
      logTest(`Table: ${table}`, false, error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function testRealTimeConnection() {
  log('\n📡 Testing Real-time Connection', colors.cyan);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logTest('Real-time Connection', false, 'Missing Supabase credentials');
    return false;
  }
  
  try {
    // Test WebSocket endpoint
    const wsUrl = SUPABASE_URL.replace('https://', 'wss://').replace('http://', 'ws://');
    const realtimeUrl = `${wsUrl}/realtime/v1/websocket?apikey=${SUPABASE_ANON_KEY}&vsn=1.0.0`;
    
    // We can't fully test WebSocket in Node.js without additional packages,
    // but we can check if the endpoint exists
    const response = await fetch(`${SUPABASE_URL}/realtime/v1/health`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY
      }
    });
    
    logTest('Real-time Service', response.ok,
      response.ok ? 'Real-time service available' : `Status: ${response.status}`);
    
    return response.ok;
  } catch (error) {
    logTest('Real-time Connection', false, error.message);
    return false;
  }
}

async function testStorageService() {
  log('\n📦 Testing Storage Service', colors.cyan);
  
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    logTest('Storage Service', false, 'Missing Supabase credentials');
    return false;
  }
  
  try {
    const response = await fetch(`${SUPABASE_URL}/storage/v1/bucket`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    logTest('Storage Service', response.ok,
      response.ok ? 'Storage service available' : `Status: ${response.status}`);
    
    return response.ok;
  } catch (error) {
    logTest('Storage Service', false, error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  log('\n🧪 Backend Connection Test Suite', colors.bright + colors.blue);
  log('================================', colors.blue);
  
  const startTime = Date.now();
  
  // Run all tests
  const envOk = await testEnvironmentVariables();
  const nextjsOk = await testNextJSServer();
  
  if (envOk) {
    await testSupabaseConnection();
    await testDatabaseTables();
    await testRealTimeConnection();
    await testStorageService();
  }
  
  if (nextjsOk) {
    await testAPIEndpoints();
  }
  
  // Summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  log('\n📊 Test Summary', colors.bright + colors.blue);
  log('==============', colors.blue);
  log(`Total Tests: ${testsRun}`, colors.cyan);
  log(`Passed: ${testsPassed}`, colors.green);
  log(`Failed: ${testsFailed}`, testsFailed > 0 ? colors.red : colors.green);
  log(`Duration: ${duration}s`, colors.cyan);
  
  if (testsFailed === 0) {
    log('\n✨ All tests passed! Backend connections are working properly.', colors.green + colors.bright);
  } else {
    log('\n⚠️  Some tests failed. Please check the details above.', colors.yellow + colors.bright);
    
    // Show recommendations
    log('\n💡 Recommendations:', colors.cyan);
    
    if (!envOk) {
      log('  1. Set up your .env.local file with Supabase credentials', colors.yellow);
    }
    
    if (!nextjsOk) {
      log('  2. Start the Next.js development server: npm run dev', colors.yellow);
    }
    
    if (results.some(r => r.name.includes('Supabase') && !r.passed)) {
      log('  3. Check if Supabase is running: supabase status', colors.yellow);
      log('     If not, start it with: supabase start', colors.yellow);
    }
  }
  
  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log('\n❌ Test suite failed with error:', colors.red);
  console.error(error);
  process.exit(1);
});
