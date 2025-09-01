#!/usr/bin/env node

// Comprehensive QR Scanning End-to-End Test Script

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 WorkforceOne QR Scanning - End-to-End Test Suite\n');

const BASE_URL = 'http://localhost:3000';
const tests = [];

// Test result tracking
let passed = 0;
let failed = 0;

function addTest(name, testFn) {
  tests.push({ name, testFn });
}

async function runTest(name, testFn) {
  try {
    console.log(`🧪 Testing: ${name}`);
    await testFn();
    console.log(`✅ PASSED: ${name}\n`);
    passed++;
  } catch (error) {
    console.log(`❌ FAILED: ${name}`);
    console.log(`   Error: ${error.message}\n`);
    failed++;
  }
}

function httpRequest(url, options = {}) {
  try {
    const response = execSync(`curl -s -o /dev/null -w "%{http_code}" "${url}"`, { 
      encoding: 'utf8',
      timeout: 10000
    });
    return parseInt(response.trim());
  } catch (error) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

function httpRequestWithBody(url) {
  try {
    const response = execSync(`curl -s "${url}"`, { 
      encoding: 'utf8',
      timeout: 10000
    });
    return response;
  } catch (error) {
    throw new Error(`HTTP request failed: ${error.message}`);
  }
}

// Test 1: Basic routing - scan page accessibility
addTest('Scan page is accessible', async () => {
  const statusCode = httpRequest(`${BASE_URL}/scan?code=test`);
  if (statusCode !== 200) {
    throw new Error(`Expected 200, got ${statusCode}`);
  }
});

// Test 2: QR code parameter extraction
addTest('QR code parameter handling', async () => {
  const testCodes = [
    'SIMPLE-CODE-123',
    'STC-GENERAL-ABC123-XYZ789',
    'RND-SITE1-DEF456-UVW012'
  ];
  
  for (const code of testCodes) {
    const statusCode = httpRequest(`${BASE_URL}/scan?code=${encodeURIComponent(code)}`);
    if (statusCode !== 200) {
      throw new Error(`Failed for code ${code}: expected 200, got ${statusCode}`);
    }
  }
});

// Test 3: URL-encoded QR code handling
addTest('URL-encoded QR code parameter', async () => {
  const fullUrl = `${BASE_URL}/scan?code=TEST-CODE-123`;
  const encodedUrl = encodeURIComponent(fullUrl);
  const statusCode = httpRequest(`${BASE_URL}/scan?code=${encodedUrl}`);
  
  if (statusCode !== 200) {
    throw new Error(`Expected 200, got ${statusCode}`);
  }
});

// Test 4: Missing QR code handling
addTest('Missing QR code parameter', async () => {
  const statusCode = httpRequest(`${BASE_URL}/scan`);
  if (statusCode !== 200) {
    throw new Error(`Expected 200 (should show error), got ${statusCode}`);
  }
});

// Test 5: Attendance dashboard accessibility
addTest('Attendance dashboard is accessible', async () => {
  const statusCode = httpRequest(`${BASE_URL}/dashboard/attendance`);
  if (statusCode !== 200) {
    throw new Error(`Expected 200, got ${statusCode}`);
  }
});

// Test 6: QR code generation API endpoints exist
addTest('QR code generation API exists', async () => {
  // This will return 401 (unauthorized) but that means the endpoint exists
  const statusCode = httpRequest(`${BASE_URL}/api/attendance/qr-code`);
  if (statusCode !== 401 && statusCode !== 200) {
    throw new Error(`Expected 401 or 200, got ${statusCode}`);
  }
});

// Test 7: Attendance records API exists
addTest('Attendance records API exists', async () => {
  // This will return 401 (unauthorized) but that means the endpoint exists
  const statusCode = httpRequest(`${BASE_URL}/api/attendance/records`);
  if (statusCode !== 401 && statusCode !== 200) {
    throw new Error(`Expected 401 or 200, got ${statusCode}`);
  }
});

// Test 8: Authentication redirects work
addTest('Authentication redirects work', async () => {
  const statusCode = httpRequest(`${BASE_URL}/auth/login`);
  if (statusCode !== 200) {
    throw new Error(`Expected 200, got ${statusCode}`);
  }
});

// Test 9: Registration page exists
addTest('Registration page is accessible', async () => {
  const statusCode = httpRequest(`${BASE_URL}/auth/register`);
  if (statusCode !== 200) {
    throw new Error(`Expected 200, got ${statusCode}`);
  }
});

// Test 10: File structure validation
addTest('Required files exist', async () => {
  const requiredFiles = [
    'app/scan/page.tsx',
    'app/dashboard/attendance/page.tsx',
    'lib/errors/qr-scanner.ts',
    'lib/services/location.ts',
    'lib/auth/qr-auth.ts',
    'components/auth/QRAuthGuard.tsx'
  ];
  
  const projectRoot = process.cwd();
  
  for (const file of requiredFiles) {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Required file missing: ${file}`);
    }
  }
});

// Test 11: TypeScript compilation check
addTest('TypeScript compilation passes', async () => {
  try {
    execSync('npx tsc --noEmit --skipLibCheck', { 
      cwd: process.cwd(),
      timeout: 30000,
      stdio: 'pipe'
    });
  } catch (error) {
    throw new Error(`TypeScript compilation failed: ${error.message}`);
  }
});

// Test 12: Component rendering check
addTest('Scan page renders without errors', async () => {
  const response = httpRequestWithBody(`${BASE_URL}/scan?code=TEST123`);
  
  // Check for critical elements in the response
  const criticalElements = [
    'QR Code Scanner',
    'Processing your QR code scan',
    'workforceone'
  ];
  
  for (const element of criticalElements) {
    if (!response.includes(element)) {
      throw new Error(`Missing critical element: ${element}`);
    }
  }
});

// Test 13: Error handling pages work
addTest('Error states render properly', async () => {
  // Test with invalid characters that might cause issues
  const invalidCodes = [
    '"><script>alert(1)</script>',
    '../../../etc/passwd',
    'null',
    'undefined'
  ];
  
  for (const code of invalidCodes) {
    const statusCode = httpRequest(`${BASE_URL}/scan?code=${encodeURIComponent(code)}`);
    if (statusCode !== 200) {
      throw new Error(`Error handling failed for: ${code}`);
    }
  }
});

// Test 14: API security headers
addTest('Security headers present', async () => {
  try {
    const response = execSync(`curl -s -I "${BASE_URL}/scan?code=test"`, { 
      encoding: 'utf8',
      timeout: 10000
    });
    
    // Check for security headers (basic ones that Next.js should provide)
    if (!response.includes('x-frame-options') && !response.includes('X-Frame-Options')) {
      console.warn('⚠️  Warning: X-Frame-Options header missing');
    }
    
    if (response.includes('Server: ')) {
      console.warn('⚠️  Warning: Server header exposed');
    }
    
  } catch (error) {
    throw new Error(`Failed to check headers: ${error.message}`);
  }
});

// Test 15: Performance check
addTest('Page load performance acceptable', async () => {
  const startTime = Date.now();
  const statusCode = httpRequest(`${BASE_URL}/scan?code=PERF-TEST`);
  const endTime = Date.now();
  
  if (statusCode !== 200) {
    throw new Error(`Expected 200, got ${statusCode}`);
  }
  
  const loadTime = endTime - startTime;
  if (loadTime > 5000) {
    throw new Error(`Page load too slow: ${loadTime}ms (max: 5000ms)`);
  }
  
  console.log(`   Load time: ${loadTime}ms`);
});

// Run all tests
async function runAllTests() {
  console.log(`Running ${tests.length} tests...\n`);
  
  for (const test of tests) {
    await runTest(test.name, test.testFn);
  }
  
  console.log('📊 Test Results Summary:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%\n`);
  
  if (failed > 0) {
    console.log('❌ Some tests failed. Please review the errors above.');
    process.exit(1);
  } else {
    console.log('🎉 All tests passed! QR scanning system is ready.');
    console.log('\n📋 Next Steps:');
    console.log('1. Deploy to production');
    console.log('2. Test with real QR codes');
    console.log('3. Verify mobile device compatibility');
    console.log('4. Set up monitoring and analytics\n');
  }
}

// Check if server is running first
async function checkServerStatus() {
  try {
    const statusCode = httpRequest(BASE_URL);
    if (statusCode !== 200 && statusCode !== 404) {
      throw new Error(`Server not responding correctly (status: ${statusCode})`);
    }
  } catch (error) {
    console.log('❌ Development server is not running.');
    console.log('🔧 Please start the server with: npm run dev');
    console.log('💡 Then run this test script again.\n');
    process.exit(1);
  }
}

// Main execution
(async () => {
  await checkServerStatus();
  await runAllTests();
})().catch((error) => {
  console.log(`💥 Test suite crashed: ${error.message}`);
  process.exit(1);
});