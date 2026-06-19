// Scripted visual playtest: drives a real playthrough against the running
// preview (localhost:4173) and captures a screenshot at each beat. Game logic is
// driven through the dev store hook (window.__realm.store); panels are opened via
// the real UI buttons. Battle math is deterministic, so the Guardian fight
// reliably shows the type chart + a forced switch. Run: node e2e/playtest.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = new URL('./playtest-shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const URL_BASE = 'http://localhost:4173/';
const GL_ARGS = ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];

// Base HP per species (from monsters.ts) so fabricated party members get a
// correct maxHp and the HP bars render right.
const BASE_HP = { matong:34, kancil:26, dugang:40, camar:24, gambang:30, bamut:44, ayaka:28, babur:38, kepiting:32, naris:27, watua:36, rabuas:33 };
const mon = (speciesId, level, bond, xp = 0, i = 0) => ({
  uid: `pt${i}`, speciesId, nickname: speciesId[0].toUpperCase() + speciesId.slice(1),
  level, xp, bond, hp: BASE_HP[speciesId] + (level - 1) * 4,
});

const errors = [];
let shotN = 0;

async function main() {
  const browser = await chromium.launch({ headless: true, args: GL_ARGS });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));

  const shot = async (name, waitMs = 350) => {
    await page.waitForTimeout(waitMs);
    const file = `${OUT}${String(++shotN).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: file });
    console.log(`  📸 ${file.split('/').pop()}`);
  };
  const api = (fn, arg) => page.evaluate(fn, arg);
  const state = () => api(() => {
    const s = window.__realm.store.getState();
    return { mode: s.mode, treats: s.treats, party: s.party.map((m) => `${m.nickname} L${m.level}`),
      guardianDefeated: s.guardianDefeated, battle: s.battle && { active: s.battle.active, enemyHp: s.battle.enemy.hp,
      mustSwitch: s.battle.mustSwitch, outcome: s.battle.outcome, log: s.battle.log.slice(-2) } };
  });

  console.log('▶ boot (fresh save)…');
  await page.goto(URL_BASE);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => !!(window).__realm?.store);
  await shot('first-run-tutorial', 1800); // onboarding card + HD-2D island

  console.log('▶ dismiss tutorial → overworld…');
  // The onboarding card's button is "Skip" (or "Got it!" on the last step).
  const skip = page.getByRole('button', { name: /Skip|Got it/ });
  if (await skip.count()) await skip.first().click();
  await shot('overworld', 600); // island, camp NPCs near spawn, HUD, treats

  console.log('▶ Field Guide (pre-discovery, mostly locked)…');
  await page.getByRole('button', { name: 'Field Guide' }).click();
  await shot('field-guide-locked');
  await page.getByRole('button', { name: 'Close' }).click();

  console.log('▶ talk to Warden Intan (boss/switch hint)…');
  await api(() => window.__realm.store.getState().talkToNpc('warden'));
  await shot('npc-dialogue-1');
  await page.getByRole('button', { name: /Next/ }).click(); // advance to line 2
  await shot('npc-dialogue-2');
  await page.getByRole('button', { name: /Close/ }).click();

  console.log('▶ taming modal (the meet-a-wild screen)…');
  await api(() => { const g = window.__realm.store.getState(); g.setNearby('wild-matong-0'); g.beginTaming('wild-matong-0'); });
  await shot('taming-modal'); // portrait, stats, Battle-to-weaken / Offer-Treat buttons

  console.log('▶ authentic tames (real tame() action, failures are free)…');
  const tamed = await api(() => {
    const g = window.__realm.store;
    for (let i = 0; i < 40 && g.getState().party.length < 1; i++) g.getState().tame('matong', 'wild-matong-0');
    g.getState().setNearby('wild-kancil-1'); g.getState().beginTaming('wild-kancil-1');
    for (let i = 0; i < 40 && g.getState().party.length < 2; i++) g.getState().tame('kancil', 'wild-kancil-1');
    g.getState().cancelTaming();
    return g.getState().party.map((m) => m.nickname);
  });
  console.log('   tamed:', tamed.join(', '));
  await page.getByRole('button', { name: /Party/ }).click();
  await shot('party-panel'); // real tamed monsters, HP/bond bars, Feed/Rest

  console.log('▶ level the starters a little (sim progression), then a wild battle…');
  await api(({ a, b }) => {
    const g = window.__realm.store;
    const p = g.getState().party;
    g.setState({ party: [{ ...p[0], ...a }, { ...p[1], ...b }] });
  }, { a: { level: 8, xp: 40, bond: 40, hp: 62 }, b: { level: 8, xp: 0, bond: 40, hp: 54 } });
  await api(() => window.__realm.store.getState().beginBattle('wild-bamut-5')); // Forest lead vs Earth wild → super effective
  await shot('wild-battle-start', 700); // arena, both fighters, moves + switch bar
  await api(() => window.__realm.store.getState().battleMove(0)); // Strike (Forest×1.5)
  await shot('wild-battle-supereffective', 700); // "It's super effective!" + damage pop
  await api(() => window.__realm.store.getState().battleMove(0)); // Strike → win
  await shot('wild-battle-win', 800); // XP, level-up, treats reward
  await api(() => window.__realm.store.getState().endBattle());

  console.log('▶ build a varied, leveled team for the Guardian…');
  await api(({ team, treats, tamed }) => {
    window.__realm.store.setState({ party: team, treats, tamedWildIds: tamed });
  }, {
    team: [mon('camar',24,100,0,1), mon('bamut',24,100,0,2), mon('babur',24,100,0,3), mon('dugang',24,100,0,4), mon('gambang',24,100,0,5)],
    treats: 9,
    tamed: ['wild-matong-0','wild-kancil-1','wild-dugang-2','wild-camar-3','wild-bamut-5','wild-babur-7','wild-gambang-4'],
  });
  await page.getByRole('button', { name: /Party/ }).click(); // refresh panel
  await page.getByRole('button', { name: /Party/ }).click();
  await shot('team-built'); // 5 monsters, Stage 3 badges, varied elements

  console.log('▶ Guardian Naris (Sky) — forced-switch win with Earth counter…');
  await api(() => window.__realm.store.getState().beginBattle('guardian-naris-0'));
  await shot('guardian-start', 800); // boss intro, switch bar with whole team
  await api(() => window.__realm.store.getState().battleMove(0)); // Camar (Sky, neutral) Strike → enemy fells Camar
  await shot('guardian-must-switch', 800); // "fainted! Send out…" forced switch UI
  await api(() => window.__realm.store.getState().battleSwitch(1)); // bring in Bamut (Earth)
  await shot('guardian-earth-in', 500);
  await api(() => window.__realm.store.getState().battleMove(0)); // Bamut Strike (Earth×1.5) → win
  await shot('guardian-win', 900); // "bested the Guardian! +15 treats"
  console.log('   state after guardian:', JSON.stringify(await state()));
  await api(() => window.__realm.store.getState().endBattle());
  await shot('after-guardian', 600); // back to explore, treats bumped

  console.log('▶ Settings (accessibility) + unlocked Field Guide…');
  await page.getByRole('button', { name: 'Settings' }).click();
  await shot('settings');
  await page.getByRole('button', { name: /^Close$/ }).click();
  await page.getByRole('button', { name: 'Field Guide' }).click();
  await shot('field-guide-unlocked'); // lore entries + colorblind element icons
  await page.getByRole('button', { name: 'Close' }).click();

  await browser.close();

  // --- Mobile pass: touch controls + battle on a phone viewport -------------
  console.log('▶ mobile pass (touch controls)…');
  const m = await chromium.launch({ headless: true, args: GL_ARGS });
  const mctx = await m.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mctx.addInitScript(() => { try { localStorage.setItem('nusantara-realm-tutorial', 'done'); } catch {} });
  const mp = await mctx.newPage();
  mp.on('pageerror', (e) => errors.push(`pageerror(mobile): ${e.message}`));
  await mp.goto(URL_BASE);
  await mp.waitForSelector('canvas');
  await mp.waitForFunction(() => !!(window).__realm?.store);
  await mp.evaluate(() => { const g = window.__realm.store; g.setState({ party: [
    { uid:'x1', speciesId:'matong', nickname:'Matong', level:6, xp:0, bond:30, hp:54 },
    { uid:'x2', speciesId:'camar', nickname:'Camar', level:6, xp:0, bond:30, hp:44 }] }); });
  await mp.waitForTimeout(1500);
  await mp.screenshot({ path: `${OUT}${String(++shotN).padStart(2,'0')}-mobile-overworld.png` });
  console.log(`  📸 mobile-overworld.png`);
  await mp.evaluate(() => window.__realm.store.getState().beginBattle('wild-bamut-5'));
  await mp.waitForTimeout(700);
  await mp.screenshot({ path: `${OUT}${String(++shotN).padStart(2,'0')}-mobile-battle.png` });
  console.log(`  📸 mobile-battle.png`);
  await m.close();

  console.log(`\n✅ playtest complete — ${shotN} screenshots in e2e/playtest-shots/`);
  console.log(errors.length ? `❌ ${errors.length} console/page errors:\n  ${errors.join('\n  ')}` : '✅ zero console/page errors');
}

main().catch((e) => { console.error('PLAYTEST FAILED:', e); process.exit(1); });
