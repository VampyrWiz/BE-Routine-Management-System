/**
 * Master Test Runner for Backend System
 *
 * CLI entry point that orchestrates multiple test suites (Jest, standalone
 * system tests, seed scripts, department tests) and prints a unified summary.
 * Supports three modes: `basic` (connectivity only), `setup` (seed data), and
 * `all` (full suite). Run with `node runAllTests.js [basic|setup|all]`.
 */

const { spawn } = require('child_process');
const path = require('path');

// Map of test category names to arrays of Jest test file paths.
// Currently configured to run only the working Jest suite.
const testCategories = {
  'Working Tests': [
    './tests/backend-complete.test.js'
  ]
};

// ANSI escape codes for colourised terminal output.
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Prints a message to the console in the specified colour.
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Spawns a Jest child process for the given category of test files and
// resolves with { category, status, code } when the process exits.
function runTestCategory(categoryName, testFiles) {
  return new Promise((resolve, reject) => {
    log(`\n${'='.repeat(60)}`, 'cyan');
    log(`🧪 Running ${categoryName}`, 'bright');
    log(`${'='.repeat(60)}`, 'cyan');

    const jestArgs = [
      '--testMatch', `<rootDir>/{${testFiles.join(',')}}`,
      '--verbose',
      '--detectOpenHandles',
      '--forceExit'
    ];

    const jest = spawn('npx', ['jest', ...jestArgs], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    jest.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${categoryName} - PASSED`, 'green');
        resolve({ category: categoryName, status: 'PASSED', code });
      } else {
        log(`❌ ${categoryName} - FAILED (exit code: ${code})`, 'red');
        resolve({ category: categoryName, status: 'FAILED', code });
      }
    });

    jest.on('error', (error) => {
      log(`❌ ${categoryName} - ERROR: ${error.message}`, 'red');
      reject({ category: categoryName, status: 'ERROR', error: error.message });
    });
  });
}

const { execSync } = require('child_process');

/**
 * Run all tests in sequence (Working Implementation)
 *
 * Executes four stages in order:
 *   1. Jest test suite (npm test)
 *   2. Standalone system test (node complete-system-test.js)
 *   3. Seed routine script (populates sample data)
 *   4. Departments test script
 *
 * Prints a per-stage pass/fail result and an overall summary.
 */
async function runAllTestsWorking() {
  console.log('🚀 Starting Complete Backend API Test Suite...');
  console.log('='.repeat(60));
  
  const startTime = Date.now();
  const testResults = {};

  try {
    // Run the comprehensive Jest test suite
    console.log('\n📍 Running Comprehensive Jest Test Suite...');
    console.log('─'.repeat(50));
    
    try {
      execSync('npm test', { 
        stdio: 'inherit', 
        cwd: process.cwd() 
      });
      testResults.jestTestSuite = '✅ PASSED';
    } catch (error) {
      console.error('❌ Jest test suite failed');
      testResults.jestTestSuite = '❌ FAILED';
    }

    // Run the working complete system test
    console.log('\n📍 Running Complete System Test...');
    console.log('─'.repeat(50));
    
    try {
      execSync('node tests/complete-system-test.js', { 
        stdio: 'inherit', 
        cwd: process.cwd() 
      });
      testResults.completeSystemTest = '✅ PASSED';
    } catch (error) {
      console.error('❌ Complete system test failed');
      testResults.completeSystemTest = '❌ FAILED';
    }

    // Run seed routine test
    console.log('\n📍 Running Seed Routine Test...');
    console.log('─'.repeat(50));
    
    try {
      execSync('node scripts/seed-routine.js', { 
        stdio: 'inherit', 
        cwd: process.cwd() 
      });
      testResults.seedRoutineTest = '✅ PASSED';
    } catch (error) {
      console.error('❌ Seed routine test failed');
      testResults.seedRoutineTest = '❌ FAILED';
    }

    // Run departments test
    console.log('\n📍 Running Departments Test...');
    console.log('─'.repeat(50));
    
    try {
      execSync('node scripts/test-departments.js', { 
        stdio: 'inherit', 
        cwd: process.cwd() 
      });
      testResults.departmentsTest = '✅ PASSED';
    } catch (error) {
      console.error('❌ Departments test failed');
      testResults.departmentsTest = '❌ FAILED';
    }

  } catch (error) {
    console.error('❌ Test suite execution error:', error.message);
  }

  // Test Results Summary
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  console.log('\n' + '='.repeat(60));
  console.log('🏁 TEST SUITE COMPLETED');
  console.log('='.repeat(60));
  console.log(`⏱️  Total Execution Time: ${duration} seconds`);
  console.log('\n📊 TEST RESULTS SUMMARY:');
  console.log('─'.repeat(40));

  Object.entries(testResults).forEach(([testName, result]) => {
    const displayName = testName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${result} ${displayName}`);
  });

  const passedTests = Object.values(testResults).filter(result => result.includes('PASSED')).length;
  const totalTests = Object.keys(testResults).length;

  console.log('\n📈 OVERALL RESULTS:');
  console.log('─'.repeat(25));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED! Backend API is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the logs above for details.');
  }

  console.log('\n' + '='.repeat(60));
  return testResults;
}

/**
 * Run basic connectivity tests only
 * A lighter entry point that solely runs the Jest suite (npm test)
 * for quick smoke-testing without seeding data or running extra scripts.
 */
async function runBasicTests() {
  console.log('🔍 Running Basic Connectivity Tests...');
  
  try {
    console.log('\n📡 Running Comprehensive Jest Test...');
    execSync('npm test', { 
      stdio: 'inherit', 
      cwd: process.cwd() 
    });
    console.log('✅ Comprehensive test passed');
  } catch (error) {
    console.log('❌ Comprehensive test failed');
  }

  console.log('\n🔍 Basic Tests Completed');
}

/**
 * Run setup tests (create sample data for the system)
 * Executes the seed-routine and test-departments scripts to populate the
 * database with sample records for development/demo purposes.
 */
async function runSetupTests() {
  console.log('⚙️ Running Setup Tests (Creating Sample Data)...');
  
  try {
    console.log('\n1️⃣ Running Seed Routine Script...');
    execSync('node scripts/seed-routine.js', { 
      stdio: 'inherit', 
      cwd: process.cwd() 
    });
    
    console.log('\n2️⃣ Running Departments Test...');
    execSync('node scripts/test-departments.js', { 
      stdio: 'inherit', 
      cwd: process.cwd() 
    });
    
    console.log('\n✅ Setup Tests Completed - Sample data created successfully!');
    
  } catch (error) {
    console.error('❌ Setup tests failed:', error.message);
  }
}

// Parses the first CLI argument and dispatches to the appropriate runner.
// Defaults to 'all' when no argument is provided.
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';

  console.log('🧪 Backend API Test Suite');
  console.log('Usage: node runAllTests.js [basic|setup|all]');
  console.log('  basic - Run basic connectivity tests');
  console.log('  setup - Create sample data for the system');
  console.log('  all   - Run complete test suite (default)');
  console.log('');

  switch (command) {
    case 'basic':
      await runBasicTests();
      break;
    case 'setup':
      await runSetupTests();
      break;
    case 'all':
    default:
      await runAllTestsWorking();
      break;
  }
}

// Runs main() when invoked directly from the CLI; exits with 1 on fatal error.
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests: runAllTestsWorking,
  runBasicTests,
  runSetupTests
};
