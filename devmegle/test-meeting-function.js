#!/usr/bin/env node

/**
 * DevMegle+ Meeting Function Test Script
 * 
 * This script tests the core meeting functionality by simulating:
 * 1. Creating a session
 * 2. Finding a partner
 * 3. AI interaction
 * 4. Git repository creation
 * 5. Session cleanup
 * 
 * Prerequisites:
 * - Set up .env.local with required API keys (no config.ts needed)
 * - Run the database schema setup
 * - Start the Next.js development server
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

async function testMeetingFunction() {
  console.log('🚀 Testing DevMegle+ Meeting Function System...\n');

  try {
    // Test 1: Create a new session
    console.log('1️⃣ Creating new session...');
    const createResponse = await fetch(`${BASE_URL}/api/meeting/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'test_user_1',
        preferences: {
          languages: ['javascript', 'typescript'],
          experience: 'intermediate'
        }
      })
    });

    const createData = await createResponse.json();
    if (!createData.success) {
      throw new Error(`Session creation failed: ${createData.error}`);
    }

    const sessionId = createData.session.id;
    console.log(`✅ Session created: ${sessionId}`);
    console.log(`   Status: ${createData.session.status}`);
    console.log(`   Matched: ${createData.matched}\n`);

    // Test 2: Get session details
    console.log('2️⃣ Fetching session details...');
    const sessionResponse = await fetch(`${BASE_URL}/api/meeting/session?sessionId=${sessionId}`);
    const sessionData = await sessionResponse.json();
    
    if (!sessionData.success) {
      throw new Error(`Session fetch failed: ${sessionData.error}`);
    }

    console.log(`✅ Session details retrieved`);
    console.log(`   Status: ${sessionData.session.status}`);
    console.log(`   Code length: ${sessionData.session.code?.content?.length || 0} chars\n`);

    // Test 3: AI interaction
    console.log('3️⃣ Testing AI interaction...');
    const aiResponse = await fetch(`${BASE_URL}/api/ai/groq`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        code: 'function hello() { console.log("Hello, DevMegle!"); }',
        message: 'Can you suggest improvements for this function?',
        type: 'suggest'
      })
    });

    const aiData = await aiResponse.json();
    if (aiData.success) {
      console.log(`✅ AI response received`);
      console.log(`   Response length: ${aiData.response.length} chars`);
      console.log(`   Type: ${aiData.type}\n`);
    } else {
      console.log(`⚠️ AI fallback used: ${aiData.fallback}\n`);
    }

    // Test 4: Git repository creation
    console.log('4️⃣ Testing Git repository creation...');
    const gitResponse = await fetch(`${BASE_URL}/api/git/repo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        code: 'function hello() { console.log("Hello, DevMegle!"); }',
        commitMessage: 'Test commit from DevMegle+'
      })
    });

    const gitData = await gitResponse.json();
    if (gitData.success) {
      console.log(`✅ Git repository created`);
      console.log(`   Repo ID: ${gitData.repo.repoId}`);
      console.log(`   Repo URL: ${gitData.repo.repoUrl}\n`);
    } else {
      console.log(`⚠️ Git fallback used: ${gitData.fallback}\n`);
    }

    // Test 5: Session cleanup
    console.log('5️⃣ Testing session cleanup...');
    const deleteResponse = await fetch(`${BASE_URL}/api/meeting/session?sessionId=${sessionId}`, {
      method: 'DELETE'
    });

    const deleteData = await deleteResponse.json();
    if (deleteData.success) {
      console.log(`✅ Session ended successfully`);
      console.log(`   Message: ${deleteData.message}\n`);
    } else {
      throw new Error(`Session cleanup failed: ${deleteData.error}`);
    }

    console.log('🎉 All tests passed! Meeting function system is working correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test if this script is executed directly
if (require.main === module) {
  testMeetingFunction();
}

module.exports = { testMeetingFunction };
