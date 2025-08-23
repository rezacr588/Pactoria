/**
 * Test script to debug authentication and contract creation
 * Run with: node test-auth-contract.js
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables (you may need to install dotenv: npm install dotenv)
require('dotenv').config({ path: '.env.local' });

// Use local Supabase for testing (no email confirmation required)
const useLocal = true; // Set to false to test with cloud Supabase

const supabaseUrl = useLocal 
  ? 'http://127.0.0.1:54321' 
  : process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabaseAnonKey = useLocal
  ? 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ Missing');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✓ Set' : '✗ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthAndContract() {
  console.log('🔍 Testing Authentication and Contract Creation\n');
  console.log('Supabase URL:', supabaseUrl);
  console.log('-----------------------------------\n');

  try {
    // Step 1: Sign in with test credentials
    console.log('1️⃣ Attempting to sign in...');
    const testEmail = `test${Date.now()}@testmail.app`; // Use a unique email
    const testPassword = 'TestPassword123!';
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (authError) {
      console.error('❌ Sign in failed:', authError.message);
      console.log('\n📝 Creating new test account...');
      console.log('Email:', testEmail);
      
      // Try to create a new account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });

      if (signUpError) {
        console.error('❌ Sign up failed:', signUpError.message);
        process.exit(1);
      }

      console.log('✅ Test account created successfully');
      console.log('User ID:', signUpData.user?.id);
      
      // Use the new session
      if (signUpData.session) {
        console.log('✅ Session obtained from sign up');
      } else {
        console.log('⚠️ No session returned - email confirmation may be required');
        console.log('Please check your email or disable email confirmation in Supabase dashboard');
        process.exit(1);
      }
    } else {
      console.log('✅ Signed in successfully');
      console.log('User ID:', authData.user?.id);
      console.log('Session Access Token:', authData.session?.access_token ? '✓ Present' : '✗ Missing');
    }

    // Step 2: Get current session
    console.log('\n2️⃣ Getting current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      console.error('❌ Failed to get session:', sessionError?.message || 'No session');
      process.exit(1);
    }

    console.log('✅ Session retrieved');
    console.log('User ID from session:', session.user.id);
    console.log('Access token present:', !!session.access_token);

    // Step 3: Test direct database insert
    console.log('\n3️⃣ Testing direct database insert (with RLS)...');
    const { data: directContract, error: directError } = await supabase
      .from('contracts')
      .insert({
        title: 'Test Contract - Direct Insert',
        owner_id: session.user.id,
        status: 'draft',
        metadata: { test: true }
      })
      .select()
      .single();

    if (directError) {
      console.error('❌ Direct insert failed:', directError.message);
      console.log('Error code:', directError.code);
      console.log('Error details:', directError.details);
      console.log('Error hint:', directError.hint);
    } else {
      console.log('✅ Direct insert successful!');
      console.log('Contract ID:', directContract.id);
      console.log('Contract Title:', directContract.title);
    }

    // Step 4: Test API endpoint
    console.log('\n4️⃣ Testing API endpoint...');
    const apiUrl = 'http://localhost:3000/api/contracts';
    
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          title: 'Test Contract - API Insert'
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error('❌ API call failed:', response.status, responseData);
      } else {
        console.log('✅ API call successful!');
        console.log('Contract:', responseData.contract);
      }
    } catch (fetchError) {
      console.error('❌ API fetch error:', fetchError.message);
      console.log('Make sure the Next.js dev server is running on http://localhost:3000');
    }

    // Step 5: Check RLS policies
    console.log('\n5️⃣ Checking RLS policies...');
    
    // This requires service role key to check policies, so we'll just try to select
    const { data: contracts, error: selectError } = await supabase
      .from('contracts')
      .select('*')
      .limit(5);

    if (selectError) {
      console.error('❌ Select failed:', selectError.message);
    } else {
      console.log('✅ Select successful!');
      console.log('Number of contracts retrieved:', contracts.length);
    }

    // Step 6: Test auth.uid() function
    console.log('\n6️⃣ Testing auth.uid() in database...');
    const { data: uidData, error: uidError } = await supabase
      .rpc('get_auth_uid'); // This function needs to be created

    if (uidError) {
      console.log('⚠️ get_auth_uid function not found (expected)');
      console.log('Creating the function would require admin access');
    } else {
      console.log('Current auth.uid():', uidData);
    }

    console.log('\n📊 Summary:');
    console.log('-----------------------------------');
    console.log('Authentication:', session ? '✅ Working' : '❌ Not working');
    console.log('Direct Insert:', directContract ? '✅ Working' : '❌ Failed');
    console.log('API Endpoint:', '⚠️ Check output above');
    console.log('\n💡 Diagnosis:');
    
    if (directError?.message?.includes('row-level security')) {
      console.log('The RLS policy is blocking the insert.');
      console.log('Possible issues:');
      console.log('1. The owner_id field doesn\'t match auth.uid()');
      console.log('2. The user is not properly authenticated');
      console.log('3. The RLS policy needs to be updated');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  } finally {
    // Sign out
    await supabase.auth.signOut();
    console.log('\n👋 Signed out');
  }
}

// Run the test
testAuthAndContract();
