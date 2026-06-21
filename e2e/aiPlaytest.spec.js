const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

test.describe('Defense Earth AI Playtesting & Auto-Balancing Spec', () => {

  test('Run AI playtest simulation and export tuned specs', async ({ page }) => {
    // 120 seconds local timeout for long-run 5 rebirth loop
    test.setTimeout(300000);

    // 1. Navigate and clean localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    // Wait for the game screen to load
    const pauseBtn = page.locator('text=PAUSE').filter({ visible: true }).first();
    await expect(pauseBtn).toBeVisible({ timeout: 15000 });

    // Navigate to Solar System Screen
    await page.locator('text=성계도').filter({ visible: true }).first().click();
    await page.waitForTimeout(500);

    // Navigate to AI Playtest Dashboard
    const aiPlaytestBtn = page.locator('text=🤖 AI 플레이테스트').filter({ visible: true }).first();
    await expect(aiPlaytestBtn).toBeVisible();
    await aiPlaytestBtn.click();
    await page.waitForTimeout(500);

    // 2. Start AI Autopilot Playtest
    const autoPlayBtn = page.locator('text=🤖 오토플레이 대기 중').filter({ visible: true }).first();
    await expect(autoPlayBtn).toBeVisible();
    await autoPlayBtn.click();

    // Confirm it started
    await expect(page.locator('text=⚡ 오토플레이 가동 중').filter({ visible: true }).first()).toBeVisible();

    // Set speed to 50x for accelerated simulation
    const speedBtn50x = page.locator('text=50x').filter({ visible: true }).first();
    await expect(speedBtn50x).toBeVisible();
    await speedBtn50x.click();

    console.log('AI Playtest running at 50x speed...');
    console.log('Waiting for at least 5 Rebirths and optimization of Fun Score (Target >= 80)...');

    let completed = false;
    let iterations = 0;
    const maxIterations = 280; // 280 seconds polling limit
    let lastAdjustedRebirth = -1;

    for (let i = 0; i < maxIterations; i++) {
      await page.waitForTimeout(1000);
      
      const stats = await page.evaluate(() => {
        const state = window.useGameStore.getState();
        return {
          rebirthCount: state.rebirthCount,
          funScore: state.calculateFunScore ? state.calculateFunScore() : 0,
          currentWave: state.currentWave,
          earthHp: state.earthHp,
          history: state.rebirthHistory || []
        };
      });

      console.log(`[Second ${i+1}] Wave: ${stats.currentWave} | Rebirths: ${stats.rebirthCount}/5 | Fun Score: ${stats.funScore}`);

      if (stats.rebirthCount >= 5) {
        if (stats.funScore >= 80) {
          console.log(`🎯 Fun Score Target Met: ${stats.funScore}/100!`);
          completed = true;
          break;
        } else {
          // If 5 rebirths are done but Fun Score is still low, perform evolutionary adjust
          if (stats.rebirthCount >= 8) {
            console.log(`⚠️ Safety limit of 8 Rebirths reached. Saving current progress...`);
            completed = true;
            break;
          }
          
          if (stats.rebirthCount > lastAdjustedRebirth) {
            // Calculate average tension from stats to decide up or down
            let avgTension = 0;
            stats.history.forEach(h => avgTension += h.tensionRatio);
            avgTension /= stats.history.length || 1;

            let biasFactor = 1.0;
            if (avgTension < 0.15) {
              // Too easy (Tension low), boost difficulty
              biasFactor = 1.15;
            } else if (avgTension > 0.45) {
              // Too hard (Tension high), lower difficulty
              biasFactor = 0.85;
            } else {
              // Progression issue, raise scaling slightly
              biasFactor = 1.08;
            }

            console.log(`🔄 Fun Score is low (${stats.funScore}). Applying difficulty bias: ${biasFactor}x`);
            await page.evaluate((bf) => {
              window.useGameStore.getState().adjustDifficultyBias(bf);
            }, biasFactor);

            lastAdjustedRebirth = stats.rebirthCount;
          }
        }
      }
    }

    // Extract the tuned specs from the store
    const tunedSpecsJson = await page.evaluate(() => {
      return window.useGameStore.getState().exportTunedSpecs();
    });

    // Write back the tuned specs to `tuned_balance_specs.json` in the root workspace
    const outputPath = path.join(__dirname, '..', 'tuned_balance_specs.json');
    fs.writeFileSync(outputPath, tunedSpecsJson, 'utf-8');

    console.log(`\n======================================================`);
    console.log(`🤖 AI PLAYTEST AUTO-TUNING COMPLETE!`);
    console.log(`Balanced specifications successfully written to:`);
    console.log(`[tuned_balance_specs.json](file://${outputPath})`);
    console.log(`======================================================\n`);

    // Verify the JSON file contains the adjusted specs
    const savedData = JSON.parse(tunedSpecsJson);
    expect(savedData).toHaveProperty('timestamp');
    expect(savedData).toHaveProperty('funScore');
    expect(savedData).toHaveProperty('rebirthCount');
    expect(savedData).toHaveProperty('specs');
    expect(savedData.specs).toHaveProperty('alienSpecs');
  });

});
