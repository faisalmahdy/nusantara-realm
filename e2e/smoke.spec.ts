import { test, expect } from '@playwright/test';

// A fast guard on the core HD-2D loop: the app boots, fetches no GLBs (HD-2D),
// throws no runtime errors, and a tame grows the party.
test('boots, stays HD-2D, and a tame grows the party', async ({ page }) => {
  const glbRequests: string[] = [];
  const pageErrors: string[] = [];
  page.on('request', (r) => { if (r.url().endsWith('.glb')) glbRequests.push(r.url()); });
  page.on('pageerror', (e) => pageErrors.push(e.message));

  await page.goto('/');
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => !!(window as any).__realm?.store);
  await page.waitForTimeout(1500); // let textures + first frames settle

  const booted = await page.evaluate(() => Array.isArray((window as any).__realm.store.getState().party));
  expect(booted).toBe(true);

  // Force a tame (rarity-1 Matong, start with treats) and confirm the party grows.
  const partyLen = await page.evaluate(() => {
    const g = (window as any).__realm.store;
    for (let i = 0; i < 40 && g.getState().party.length === 0; i++) g.getState().tame('matong', 'wild-matong-0');
    return g.getState().party.length;
  });
  expect(partyLen).toBeGreaterThan(0);

  // HD-2D must never fetch a GLB, and nothing should throw.
  expect(glbRequests).toHaveLength(0);
  expect(pageErrors).toHaveLength(0);
});
