const { test, expect } = require('@playwright/test');
const { chromium } = require('playwright');

test('Verify no memory leaks in the web game rendering loop', async () => {
  // Launch browser with garbage collection exposed
  const browser = await chromium.launch({
    args: ['--js-flags=--expose-gc']
  });
  
  const context = await browser.newContext();
  const page = await context.newPage();

  // Capture page logs
  page.on('console', msg => {
    if (msg.text().startsWith('MEM_LOG:')) {
      console.log(msg.text());
    }
  });

  await page.goto('/');

  // Wait for the app to load
  const pauseBtn = page.locator('text=PAUSE').filter({ visible: true }).first();
  await expect(pauseBtn).toBeVisible({ timeout: 15000 });

  console.log('🤖 Setting up memory leak simulation...');

  // Build satellites, add energy, and prep simulation state
  await page.evaluate(() => {
    const store = window.useGameStore.getState();
    store.cheatCredits(100000);
    store.cheatMaxEnergy(10000);
    
    // Build multiple satellite types to test all rendering classes
    store.buildOrbitalSatelliteDetail('earth', 'laser');
    store.buildOrbitalSatelliteDetail('earth', 'laser');
    store.buildOrbitalSatelliteDetail('earth', 'emp');
    store.buildOrbitalSatelliteDetail('earth', 'plasmaLaser');
    store.buildOrbitalSatelliteDetail('earth', 'clusterMissile');
    store.buildOrbitalSatelliteDetail('earth', 'gravityBomb');
    
    // Spawn initial enemies
    store.cheatAdvanceWaves(5);
  });

  // Wait for React to render and mount all SVG elements
  await page.waitForTimeout(1000);

  // Measure initial memory after GC
  const initialMemory = await page.evaluate(() => {
    if (typeof window.gc !== 'function') {
      return { err: 'V8 garbage collection is not exposed. Run browser with --expose-gc flag.' };
    }
    window.gc(); // Trigger garbage collection
    
    const heap = window.performance?.memory?.usedJSHeapSize;
    return { heap };
  });

  if (initialMemory.err) {
    console.error(initialMemory.err);
    await browser.close();
    expect(initialMemory.err).toBeUndefined();
    return;
  }

  const startHeapMB = (initialMemory.heap / (1024 * 1024)).toFixed(2);
  console.log(`📊 Initial JS Heap (Post-GC): ${startHeapMB} MB`);

  // Run 1000 frames/ticks of the game engine in a fast loop inside page context
  console.log('⚡ Simulating 1,000 tick updates at high speed...');
  await page.evaluate(async () => {
    const store = window.useGameStore.getState();
    const tickStep = 0.05;
    
    for (let i = 0; i < 1000; i++) {
      // Tick the state engine (simulates projectile move, satellite rotations, etc.)
      store.tick(tickStep);
      
      // Yield to let React process updates & SVG render cycle run
      if (i % 20 === 0) {
        await new Promise(resolve => setTimeout(resolve, 1));
      }
    }
  });

  // Let DOM settle down and yield for any leftover event loops
  await page.waitForTimeout(2000);

  // Measure final memory after GC
  const finalMemory = await page.evaluate(() => {
    window.gc(); // Trigger garbage collection again
    const heap = window.performance?.memory?.usedJSHeapSize;
    return { heap };
  });

  const endHeapMB = (finalMemory.heap / (1024 * 1024)).toFixed(2);
  const diffMB = ((finalMemory.heap - initialMemory.heap) / (1024 * 1024)).toFixed(2);
  
  console.log(`📊 Final JS Heap (Post-GC): ${endHeapMB} MB`);
  console.log(`📈 Memory difference (after 1000 ticks): ${diffMB} MB`);

  await browser.close();

  // Assert that memory growth after 1000 ticks & garbage collection is minimal (e.g. < 5MB)
  // React fiber pool and minor caches might retain a very small amount, but a leak would be 50-100MB+
  const memoryGrowthMB = parseFloat(diffMB);
  expect(memoryGrowthMB).toBeLessThan(10.0);
  console.log('✅ Memory leak check passed successfully!');
});
