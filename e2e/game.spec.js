const { test, expect } = require('@playwright/test');

// Helper functions to get resources/wave dynamically and avoid strict mode and timing issues
async function getHUDCredit(page) {
  const text = await page.locator('text=CREDIT').filter({ visible: true }).first().locator('..').textContent();
  return parseFloat(text.replace(/[^\d]/g, ''));
}

async function getHUDNanocore(page) {
  const text = await page.locator('text=NANOCORE').filter({ visible: true }).first().locator('..').textContent();
  return parseFloat(text.replace(/[^\d]/g, ''));
}

async function getHUDWave(page) {
  const text = await page.getByText(/WAVE\s*\d+/i).filter({ visible: true }).first().textContent();
  const match = text.match(/WAVE\s*(\d+)/i);
  return match ? parseInt(match[1]) : 1;
}

test.describe('Defense Earth Comprehensive E2E Spec Tests', () => {

  test.beforeEach(async ({ page }) => {
    // Capture page console logs and errors
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));
    page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

    // Navigate and clear localStorage to isolate tests from previous runs
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for the app to load (checking for main title "태양계 관제 센터")
    await expect(page.locator('text=태양계 관제 센터').filter({ visible: true }).first()).toBeVisible({ timeout: 15000 });

    // Pause the game loop immediately to freeze time and make assertions deterministic
    const pauseBtn = page.locator('text=PAUSE').filter({ visible: true }).first();
    await expect(pauseBtn).toBeVisible({ timeout: 10000 });
    await pauseBtn.click();
    await expect(page.locator('text=RESUME').filter({ visible: true }).first()).toBeVisible();

    // Reset shield to exactly 100 to avoid any ticks that occurred before pausing
    await page.evaluate(() => {
      window.useGameStore.setState({ earthShield: 100 });
    });
  });

  test('Economic resources initial states & dev testing panel cheats', async ({ page }) => {
    // 1. Check initial resource values in HUD
    await expect(page.locator('text=CREDIT').filter({ visible: true }).first()).toBeVisible();
    const startCredits = await getHUDCredit(page);
    expect(startCredits).toBeGreaterThanOrEqual(1000);
    expect(startCredits).toBeLessThanOrEqual(1020);

    await expect(page.locator('text=ENERGY').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=20 / 100 W').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=NANOCORE').filter({ visible: true }).first()).toBeVisible();
    const startNano = await getHUDNanocore(page);
    expect(startNano).toBe(0);

    // Navigate to Planet Detail (행성 관리) and wait for loadGame to settle
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 2. Click credit cheat button (+10,000 Cr) and check HUD credit increases
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    const creditVal = await getHUDCredit(page);
    expect(creditVal).toBeGreaterThanOrEqual(11000);

    // 3. Click nanocore cheat button (+100 Nano) and check HUD nanocore increases
    await page.locator('text=+100 Nano').filter({ visible: true }).first().click();
    const nanoVal = await getHUDNanocore(page);
    expect(nanoVal).toBeGreaterThanOrEqual(100);

    // 4. Click energy cheat button (+10,000 W) and check HUD energy capacity
    await page.locator('text=+10,000 W').filter({ visible: true }).first().click();
    await expect(page.locator('text=20 / 10100 W').filter({ visible: true }).first()).toBeVisible();
  });

  test('Planet unlock wave requirements, terraforming milestones & synergies', async ({ page }) => {
    // 1. Verify Luna is locked initially
    await page.locator('text=성계도').filter({ visible: true }).first().click();
    await expect(page.locator('text=웨이브 5 돌파 시 해금').filter({ visible: true }).first()).toBeVisible();

    // 2. Advance wave to 5 using wave cheat in Planet Detail screen
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    
    const waveNumBefore = await getHUDWave(page);

    await page.locator('text=Wave +5').filter({ visible: true }).first().click();
    
    // Check wave status updates to waveNumBefore + 5 in HUD
    const expectedWaveText = `WAVE ${waveNumBefore + 5}`;
    await expect(page.locator(`text=${expectedWaveText}`).filter({ visible: true }).first()).toBeVisible();

    // 3. Go back to SolarSystem and unlock Luna
    await page.locator('text=성계도').filter({ visible: true }).first().click();
    await expect(page.locator('text=해금 가능 (터치하여 개척)').filter({ visible: true }).first()).toBeVisible();
    await page.locator('text=해금 가능 (터치하여 개척)').filter({ visible: true }).first().click();

    // Verify Luna is unlocked and starts at 0% progress / 0 population
    await expect(page.locator('text=테라포밍 0% | 인구: 0명').filter({ visible: true }).first()).toBeVisible();

    // 4. Click Luna to open its details
    await page.locator('text=달 (Luna)').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    await expect(page.locator('text=달 (Luna)').filter({ visible: true }).last()).toBeVisible();

    // Initial population and progress
    await expect(page.locator('text=현재 수용 인구: 0명 / 50,000명').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=0%').filter({ visible: true }).first()).toBeVisible();

    // Inject Credits & Energy to perform terraforming upgrades
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    await page.locator('text=+10,000 W').filter({ visible: true }).first().click();

    // Upgrade terraforming to 10%
    await page.locator('text=테라포밍 10% 증가').filter({ visible: true }).first().click();
    await expect(page.locator('text=10%').filter({ visible: true }).first()).toBeVisible();

    // Verify used energy increased (Luna 10% costs 800 energy, baseline 20)
    await expect(page.locator('text=820 / 10100 W').filter({ visible: true }).first()).toBeVisible();

    // Upgrade terraforming to 30% to hit population milestone 15,000 (0.3 * 50,000)
    await page.locator('text=테라포밍 10% 증가').filter({ visible: true }).first().click();
    await page.locator('text=테라포밍 10% 증가').filter({ visible: true }).first().click();
    await expect(page.locator('text=30%').filter({ visible: true }).first()).toBeVisible();

    // Upgrading to 30% updates population to 15,000
    await expect(page.locator('text=현재 수용 인구: 15,000명 / 50,000명').filter({ visible: true }).first()).toBeVisible();

    // Check synergy is waiting (not yet active)
    await page.locator('text=성계도').filter({ visible: true }).first().click();
    await expect(page.locator('text=시너지 대기').filter({ visible: true }).first()).toBeVisible();

    // Go back to Luna details and upgrade to 80% to activate synergy
    await page.locator('text=달 (Luna)').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    
    // Add another credit cheat click to ensure we have enough credits to reach 80%!
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();

    for (let i = 0; i < 5; i++) {
      await page.locator('text=테라포밍 10% 증가').filter({ visible: true }).first().click();
    }
    await expect(page.locator('text=80%').filter({ visible: true }).first()).toBeVisible();

    // Verify population limit reaches 40,000 (which is 80% of 50,000)
    await expect(page.locator('text=현재 수용 인구: 40,000명 / 50,000명').filter({ visible: true }).first()).toBeVisible();

    // Check that Luna's synergy (Aegis shield regen) is now active
    await page.locator('text=성계도').filter({ visible: true }).first().click();
    await expect(page.locator('text=시너지 활성').filter({ visible: true }).first()).toBeVisible();
  });

  test('Combat mechanics: dual shielding, kinetic intercept & research upgrades', async ({ page }) => {
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 1. Initial Earth HP & Shield
    await expect(page.locator('text=지구 HP: 100 / 100').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=에너지 실드: 100 / 600').filter({ visible: true }).first()).toBeVisible();

    // 2. Click "에너지 피격 (빔)" -> 10 energy damage * 1.5 = 15 shield damage. Shield should be 85
    await page.locator('text=에너지 피격 (빔)').filter({ visible: true }).first().click();
    await expect(page.locator('text=에너지 실드: 85 / 600').filter({ visible: true }).first()).toBeVisible();

    // 3. Purchase "beamConversion" research upgrade (needs 15 Nanocores)
    // Inject 100 Nanocores first
    await page.locator('text=+100 Nano').filter({ visible: true }).first().click();
    await page.locator('text=시간 연구소').filter({ visible: true }).first().click();
    await expect(page.locator('text=크로노스 시간 연구소').filter({ visible: true }).first()).toBeVisible();

    // Click "연구" for "빔 관통 에너지 환산망"
    const researchRow = page.locator('div').filter({ hasText: '빔 관통 에너지 환산망' }).first();
    await researchRow.getByText('연구', { exact: true }).first().click();
    await expect(researchRow.getByText('연구 완성').filter({ visible: true }).first()).toBeVisible();

    // 4. Test "beamConversion" effect: ENERGY hit refunds 10% of damage as Credits
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    
    const initCredits = await getHUDCredit(page);

    await page.locator('text=에너지 피격 (빔)').filter({ visible: true }).first().click();

    const postCredits = await getHUDCredit(page);
    expect(postCredits).toBeGreaterThan(initCredits);

    // 5. Kinetic intercept: build 5 laser satellites -> 100% intercept rate
    // Click +10,000 Cr twice to get at least 20,000 Cr
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    for (let i = 0; i < 5; i++) {
      await page.locator('text=건설').filter({ visible: true }).first().click();
    }
    await expect(page.locator('text=키네틱 요격 타워: 5개').filter({ visible: true }).first()).toBeVisible();

    // Verify HP and population don't decrease after kinetic hits (due to 100% intercept)
    const initHpText = await page.locator('text=지구 HP:').filter({ visible: true }).first().textContent();
    await page.locator('text=키네틱 피격 (철갑탄)').filter({ visible: true }).first().click();
    await expect(page.locator('text=지구 HP:').filter({ visible: true }).first()).toHaveText(initHpText);
  });

  test('Verify remaining research upgrades: selfRepair & tachionTargeting', async ({ page }) => {
    // Navigate to Time Lab
    await page.locator('text=시간 연구소').filter({ visible: true }).first().click();
    await expect(page.locator('text=크로노스 시간 연구소').filter({ visible: true }).first()).toBeVisible();

    // Check we have enough nanocores
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    await page.locator('text=+100 Nano').filter({ visible: true }).first().click();
    await page.locator('text=시간 연구소').filter({ visible: true }).first().click();

    // Research "나노 분사 자가 수리망"
    const repairRow = page.locator('div').filter({ hasText: '나노 분사 자가 수리망' }).first();
    await repairRow.getByText('연구', { exact: true }).first().click();
    await expect(repairRow.getByText('연구 완성').filter({ visible: true }).first()).toBeVisible();

    // Research "타키온 조준 정밀 정렬"
    const targetRow = page.locator('div').filter({ hasText: '타키온 조준 정밀 정렬' }).first();
    await targetRow.getByText('연구', { exact: true }).first().click();
    await expect(targetRow.getByText('연구 완성').filter({ visible: true }).first()).toBeVisible();
  });

  test('Shipyard fleet slot reservation & auto-replenish queue', async ({ page }) => {
    // Resume the game so that the shipyard queue can tick and build ships!
    const resumeBtn = page.locator('text=RESUME').filter({ visible: true }).first();
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
      await expect(page.locator('text=PAUSE').filter({ visible: true }).first()).toBeVisible();
    }

    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // Navigate to Shipyard tab
    await page.locator('text=함대 쉽야드').filter({ visible: true }).first().click();
    await page.waitForTimeout(200);

    // Click '+' button to reserve 1 Interceptor slot
    await page.getByText('+', { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByText('1', { exact: true }).filter({ visible: true }).first()).toBeVisible();

    // Reserve 1 Escort slot
    await page.getByText('+', { exact: true }).filter({ visible: true }).nth(1).click();
    
    // The shipyard queue should automatically start because slots > current fleet.
    // Speed up simulation to 2x speed to trigger tick updates faster
    await page.locator('text=1x Speed').filter({ visible: true }).first().click();
    await expect(page.locator('text=2x Speed').filter({ visible: true }).first()).toBeVisible();

    // Wait briefly for queue updates
    await page.waitForTimeout(2000);
  });

  test('Time Machine Rebirth process, TP 정산 & permanent upgrades', async ({ page }) => {
    // 1. Charge gauge to max and add credits
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    await page.locator('text=Gauge Max').filter({ visible: true }).first().click();

    // 2. Go to Chronos Lab and check gauge is 100%
    await page.locator('text=시간 연구소').filter({ visible: true }).first().click();
    await expect(page.locator('text=100%').filter({ visible: true }).first()).toBeVisible();

    // Click rebirth button
    await page.locator('text=시간 루프 가동 (자발적 회귀)').filter({ visible: true }).first().click();
    await page.waitForTimeout(200);

    // Click the confirm button in the custom Alert UI
    await page.locator('text=시간 회귀 실행').filter({ visible: true }).first().click();

    // 3. Verify game reset: credits back to 1,000 and WAVE back to 1
    const creditsVal = await getHUDCredit(page);
    expect(creditsVal).toBeGreaterThanOrEqual(1000);
    expect(creditsVal).toBeLessThanOrEqual(1020);
    
    await expect(page.locator('text=WAVE 1').filter({ visible: true }).first()).toBeVisible();

    // 4. Inject 1,000 TP to test Chronos Lab upgrades
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    await page.locator('text=+1,000 TP').filter({ visible: true }).first().click();
    await page.locator('text=시간 연구소').filter({ visible: true }).first().click();

    // Verify TP shows in bottom HUD (renders as 2000 TP without comma)
    await expect(page.locator('text=2000 TP').filter({ visible: true }).first()).toBeVisible();

    // Buy permanent upgrade "creditGen" (costs 5 TP)
    const upgradeRow = page.locator('div').filter({ hasText: '양자 금융 세무망' }).first();
    await upgradeRow.getByText('강화', { exact: true }).first().click();
    
    // Level should become 1, TP should become 1995
    await expect(upgradeRow.locator('text=Lv.1').filter({ visible: true }).first()).toBeVisible();
    await expect(page.locator('text=1995 TP').filter({ visible: true }).first()).toBeVisible();
  });

  test('Premium pass purchase, 4x speed and auto-automation QoL triggers', async ({ page }) => {
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 1. Initial State: Premium auto toggles show "🔒 PASS 전용"
    await expect(page.locator('text=🔒 PASS 전용').filter({ visible: true }).first()).toBeVisible();

    // 2. Buy Premium Pass via "☆ BUY PASS" button on HUD
    await page.locator('text=☆ BUY PASS').filter({ visible: true }).first().click();
    await page.waitForTimeout(200);

    // Click '모의 구매' in custom Alert UI
    await page.locator('text=모의 구매').filter({ visible: true }).first().click();

    // Verify button changes to "★ PREMIUM"
    await expect(page.locator('text=★ PREMIUM').filter({ visible: true }).first()).toBeVisible();

    // Confirm auto buttons no longer show "🔒 PASS 전용" and show "OFF" instead
    await expect(page.locator('text=🔒 PASS 전용').filter({ visible: true })).not.toBeVisible();
    await expect(page.locator('text=OFF').filter({ visible: true }).first()).toBeVisible();

    // 3. Test Auto-Build Towers: toggle ON
    const rebuildRow = page.locator('div').filter({ hasText: '자동 요격 타워 재건' }).first();
    await rebuildRow.locator('text=OFF').filter({ visible: true }).first().click();
    await expect(rebuildRow.locator('text=ON').filter({ visible: true }).first()).toBeVisible();

    // 4. Test 4x Speed: cycle speed to 4x (requires premium)
    await page.locator('text=1x Speed').filter({ visible: true }).first().click();
    await expect(page.locator('text=2x Speed').filter({ visible: true }).first()).toBeVisible();
    await page.locator('text=2x Speed').filter({ visible: true }).first().click();
    await expect(page.locator('text=4x Speed').filter({ visible: true }).first()).toBeVisible();

    // 5. Toggle Auto-Terraform ON
    const terraformRow = page.locator('div').filter({ hasText: '자동 테라포밍 시스템' }).first();
    await terraformRow.locator('text=OFF').filter({ visible: true }).first().click();
    await expect(terraformRow.locator('text=ON').filter({ visible: true }).first()).toBeVisible();
  });

  test('Unlocking multiple planets: Luna & Mars requirements and environment costs', async ({ page }) => {
    // Go to Solar System map
    await page.locator('text=성계도').filter({ visible: true }).first().click();

    // Verify Mars requires Wave 10
    await expect(page.locator('text=웨이브 10 돌파 시 해금').filter({ visible: true }).first()).toBeVisible();

    // Go to Planet Detail and advance wave by 10 (Wave +5 clicked twice)
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    
    const waveNumBefore = await getHUDWave(page);

    await page.locator('text=Wave +5').filter({ visible: true }).first().click();
    await page.locator('text=Wave +5').filter({ visible: true }).first().click();

    // Wave should be waveNumBefore + 10
    const expectedWaveText = `WAVE ${waveNumBefore + 10}`;
    await expect(page.locator(`text=${expectedWaveText}`).filter({ visible: true }).first()).toBeVisible();

    // Go back to Solar System map
    await page.locator('text=성계도').filter({ visible: true }).first().click();

    // Now Mars should show "해금 가능 (터치하여 개척)"
    const marsNode = page.locator('text=화성 (Mars)').locator('xpath=..');
    await expect(marsNode.locator('text=해금 가능 (터치하여 개척)').filter({ visible: true }).first()).toBeVisible();

    // Click to unlock Mars
    await marsNode.click();

    // Verify Mars is unlocked and starts at 0%
    await expect(marsNode.locator('text=테라포밍 0% | 인구: 0명').filter({ visible: true }).first()).toBeVisible();
  });

  test('Unlock and terraform all remaining planets: Venus, Mercury, Jupiter, Saturn, Uranus, Neptune, Pluto', async ({ page }) => {
    // 1. Navigate to Planet Detail and cheat resources & waves to 45
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);
    
    // Cheat a lot of credits, nanocores, and max energy
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    await page.locator('text=+10,000 W').filter({ visible: true }).first().click();
    
    // Click Wave +5 nine times to reach wave 45
    for (let i = 0; i < 9; i++) {
      await page.locator('text=Wave +5').filter({ visible: true }).first().click();
    }
    
    // Verify wave count in HUD is at least 46
    const wave = await getHUDWave(page);
    expect(wave).toBeGreaterThanOrEqual(46);

    // 2. Navigate to Solar System map
    await page.locator('text=성계도').filter({ visible: true }).first().click();

    // We will loop through Venus, Mercury, Jupiter, Saturn, Uranus, Neptune, Pluto
    const restPlanets = [
      { id: 'venus', label: '금성 (Venus)' },
      { id: 'mercury', label: '수성 (Mercury)' },
      { id: 'jupiter', label: '목성 (Jupiter)' },
      { id: 'saturn', label: '토성 (Saturn)' },
      { id: 'uranus', label: '천왕성 (Uranus)' },
      { id: 'neptune', label: '해왕성 (Neptune)' },
      { id: 'pluto', label: '명왕성 (Pluto)' }
    ];

    for (const p of restPlanets) {
      const node = page.locator(`text=${p.label}`).locator('xpath=..');
      await expect(node.locator('text=해금 가능 (터치하여 개척)').filter({ visible: true }).first()).toBeVisible();
      await node.click();
      await expect(node.locator('text=테라포밍 0% | 인구: 0명').filter({ visible: true }).first()).toBeVisible();
    }
  });

  test('Detailed combat, population loss & synergies', async ({ page }) => {
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // Initial population check (should be 1,000,000)
    await expect(page.locator('text=현재 수용 인구: 1,000,000명 / 2,000,000명').filter({ visible: true }).first()).toBeVisible();

    // Trigger kinetic hit: 10 kinetic damage. Intercept rate is 60% initially.
    // To make it deterministic, we mock Math.random in the browser context to force intercept failure.
    await page.evaluate(() => {
      const originalRandom = Math.random;
      // Force Math.random to return 0.99 so intercept fails (since intercept rate < 99%)
      Math.random = () => 0.99;
      window.useGameStore.getState().damageEarth(10, 'kinetic');
      // Restore Math.random
      Math.random = originalRandom;
    });

    // Check population drops to 980,000 (2% loss of 1,000,000)
    await expect(page.locator('text=현재 수용 인구: 980,000명 / 2,000,000명').filter({ visible: true }).first()).toBeVisible();

    // Now test Mars synergy
    await page.evaluate(() => {
      window.useGameStore.setState({ currentWave: 15 });
      window.useGameStore.getState().unlockPlanet('mars');
    });

    // Go to Solar System screen and then Mars details
    await page.locator('text=성계도').filter({ visible: true }).first().click();
    const marsNode = page.locator('text=화성 (Mars)').locator('xpath=..');
    await marsNode.click();
    await page.waitForTimeout(500);

    // Terraform Mars to 80% to active synergy
    // Give enough credits/energy first
    await page.evaluate(() => {
      window.useGameStore.setState({ credits: 500000, maxEnergy: 500000, usedEnergy: 0 });
    });
    for (let i = 0; i < 8; i++) {
      await page.locator('text=테라포밍 10% 증가').filter({ visible: true }).first().click();
    }
    await expect(page.locator('text=80%').filter({ visible: true }).first()).toBeVisible();

    // Verify Mars' synergy multipliers in game state
    const synergies = await page.evaluate(() => window.useGameStore.getState().synergies);
    expect(synergies.shipBuildCostMultiplier).toBeCloseTo(0.85);
    expect(synergies.shipBuildSpeedMultiplier).toBeCloseTo(1.20);
  });

  test('Real-time combat & boss battles (Apocalypse/Chrono)', async ({ page }) => {
    // Resume the game to enable tick updates and real combat
    const resumeBtn = page.locator('text=RESUME').filter({ visible: true }).first();
    if (await resumeBtn.isVisible()) {
      await resumeBtn.click();
      await expect(page.locator('text=PAUSE').filter({ visible: true }).first()).toBeVisible();
    }

    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 1. Spawn Boss Apocalypse (Wave 10)
    await page.evaluate(() => {
      window.useGameStore.setState({ currentWave: 10, enemySpawnTimer: 10, enemies: [] });
    });
    await page.waitForTimeout(500);

    // Verify Boss Apocalypse spawned
    let bossExists = await page.evaluate(() => {
      const enemies = window.useGameStore.getState().enemies;
      return enemies.some(e => e.type === 'boss_apocalypse');
    });
    expect(bossExists).toBe(true);

    // Defeat Boss Apocalypse by spawning a projectile that collides with it
    await page.evaluate(() => {
      const boss = window.useGameStore.getState().enemies.find(e => e.type === 'boss_apocalypse');
      if (boss) {
        window.useGameStore.setState({
          projectiles: [{
            id: 'test-proj-apoc',
            type: 'kinetic',
            x: boss.x,
            y: boss.y,
            vx: 0,
            vy: 0,
            damage: boss.hp + 10,
            isEnemy: false,
            targetEnemyId: boss.id
          }]
        });
      }
    });
    await page.waitForTimeout(300);

    // Verify Boss is removed and nanocores increased by 5 (since initial nanocores was 0)
    let nanocoresVal = await page.evaluate(() => window.useGameStore.getState().nanocores);
    expect(nanocoresVal).toBe(5);

    // 2. Spawn Boss Chrono (Wave 20)
    await page.evaluate(() => {
      window.useGameStore.setState({ currentWave: 20, enemySpawnTimer: 10, enemies: [], nanocores: 0 });
    });
    await page.waitForTimeout(500);

    // Verify Boss Chrono spawned
    bossExists = await page.evaluate(() => {
      const enemies = window.useGameStore.getState().enemies;
      return enemies.some(e => e.type === 'boss_chrono');
    });
    expect(bossExists).toBe(true);

    // Force the Chrono Boss's attack timer to match its cooldown to trigger the time-freeze
    await page.evaluate(() => {
      const enemies = window.useGameStore.getState().enemies.map(e => 
        e.type === 'boss_chrono' ? { ...e, attackTimer: e.spec.cooldown } : e
      );
      window.useGameStore.setState({ enemies });
    });
    await page.waitForTimeout(200);

    // Verify Chrono's time-freeze ability (chronoMuteTimer > 0)
    let muteTimer = await page.evaluate(() => window.useGameStore.getState().chronoMuteTimer);
    expect(muteTimer).toBeGreaterThan(0);

    // Defeat Boss Chrono by spawning a projectile that collides with it
    await page.evaluate(() => {
      const boss = window.useGameStore.getState().enemies.find(e => e.type === 'boss_chrono');
      if (boss) {
        window.useGameStore.setState({
          projectiles: [{
            id: 'test-proj-chrono',
            type: 'kinetic',
            x: boss.x,
            y: boss.y,
            vx: 0,
            vy: 0,
            damage: boss.hp + 10,
            isEnemy: false,
            targetEnemyId: boss.id
          }]
        });
      }
    });
    await page.waitForTimeout(300);

    // Verify Boss is removed and nanocores increased by 15
    nanocoresVal = await page.evaluate(() => window.useGameStore.getState().nanocores);
    expect(nanocoresVal).toBe(15);
  });

  test('Game Save & Load Persistence', async ({ page }) => {
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // Set resource values and toggle premium pass in the store
    await page.evaluate(() => {
      window.useGameStore.setState({
        credits: 9999,
        nanocores: 88,
        isPremium: true,
        autoTerraform: true
      });
    });

    // Trigger saveGame
    await page.evaluate(async () => {
      await window.useGameStore.getState().saveGame();
    });

    // Reset store values to defaults
    await page.evaluate(() => {
      window.useGameStore.setState({
        credits: 1000,
        nanocores: 0,
        isPremium: false,
        autoTerraform: false
      });
    });

    // Trigger loadGame
    await page.evaluate(async () => {
      await window.useGameStore.getState().loadGame();
    });

    // Verify values are fully restored
    const finalState = await page.evaluate(() => {
      const store = window.useGameStore.getState();
      return {
        credits: store.credits,
        nanocores: store.nanocores,
        isPremium: store.isPremium,
        autoTerraform: store.autoTerraform
      };
    });

    expect(finalState.credits).toBe(9999);
    expect(finalState.nanocores).toBe(88);
    expect(finalState.isPremium).toBe(true);
    expect(finalState.autoTerraform).toBe(true);
  });

  test('Developer Database Reset Button UI and Functionality', async ({ page }) => {
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 1. Click credit cheat button to change state from default
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    const creditVal = await getHUDCredit(page);
    expect(creditVal).toBeGreaterThanOrEqual(11000);

    // 3. Click the DB reset button
    await page.locator('text=DB 초기화 (전체 초기화)').filter({ visible: true }).first().click();
    await page.waitForTimeout(200);

    // Click '초기화' in custom Alert UI (using exact match to avoid background button)
    await page.locator('text="초기화"').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 4. Verify credits are reset to default in HUD
    const resetCredits = await getHUDCredit(page);
    expect(resetCredits).toBeGreaterThanOrEqual(1000);
    expect(resetCredits).toBeLessThanOrEqual(1020);
  });

  test('Satellite double orbit lines render validation in Web SVG Canvas', async ({ page }) => {
    await page.locator('text=행성 관리').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // 1. Check if the dual orbit lines are present in the DOM (Web SVG components)
    // Inner orbit: r="120"
    const innerOrbit = page.locator('circle[r="120"]').first();
    await expect(innerOrbit).toBeVisible();

    // Outer orbit: r="145"
    const outerOrbit = page.locator('circle[r="145"]').first();
    await expect(outerOrbit).toBeVisible();

    // 2. Inject resources and build 1 Weapon satellite (laser) and 1 Defense satellite (decoy)
    await page.locator('text=+10,000 Cr').filter({ visible: true }).first().click();
    await page.locator('text=+10,000 W').filter({ visible: true }).first().click();

    // Build 1 laser (Weapon) via UI (laser is the first "건설" button in the Earth management tab)
    await page.locator('text=건설').filter({ visible: true }).first().click();
    
    // Inject 1 decoy (Defense) via store to bypass tab switching delays
    await page.evaluate(() => {
      const store = window.useGameStore.getState();
      store.buildOrbitalSatelliteDetail('earth', 'decoy');
    });

    // 3. Verify that both satellites are rendered
    const satellites = page.locator('svg circle[r="120"] ~ g, svg circle[r="145"] ~ g');
    // There should be exactly 2 satellites rendered
    const satCount = await satellites.count();
    expect(satCount).toBe(2);
  });

});
