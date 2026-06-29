const { injectBug, restoreBug } = require('../lib/bugInjector');

console.log('\n=== FixLoop Bug Test Script ===\n');
console.log('This script toggles the CSS bug for manual visual testing.\n');
console.log('Current state:');
console.log('  - Clean state: z-index: 10 (button clickable, no overlay visible)');
console.log('  - Bugged state: z-index: 0 (button behind dark overlay, unclickable)\n');

const args = process.argv.slice(2);
const action = args[0];

if (action === 'inject') {
  console.log('Injecting bug...');
  injectBug();
  console.log('✓ Bug injected! The checkout button should now be behind a dark overlay.');
  console.log('  Refresh your browser to see the effect.');
  console.log('  Run: npm run dev scripts/test-bug.ts restore to fix.\n');
} else if (action === 'restore') {
  console.log('Restoring clean state...');
  restoreBug();
  console.log('✓ Bug restored! The checkout button should be visible and clickable.');
  console.log('  Refresh your browser to see the effect.\n');
} else {
  console.log('Usage:');
  console.log('  npx ts-node scripts/test-bug.ts inject   - Inject the bug');
  console.log('  npx ts-node scripts/test-bug.ts restore  - Restore clean state\n');
}
