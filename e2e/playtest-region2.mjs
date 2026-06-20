// Region-2 playtest: the dock gate, sailing to Beringin Reach, its distinct
// look + new roster, the Reefwarden, and the Banyan-titan Guardian (Forest,
// countered by Spirit). Drives game logic through the dev store hook; battle
// math is deterministic so the boss fight reliably shows a Spirit super-effective
// win after a forced switch. Run: node e2e/playtest-region2.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = new URL('./playtest-shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const URL_BASE = 'http://localhost:4173/';
const GL = ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];
const BASE_HP = { gambang: 30, ayaka: 28, penyu: 46, karang: 42, warking: 30 };
const mon = (speciesId, level, i) => ({
  uid: `r${i}`, speciesId, nickname: speciesId[0].toUpperCase() + speciesId.slice(1),
  level, xp: 0, bond: 100, hp: BASE_HP[speciesId] + (level - 1) * 4,
});
const errors = [];
let n = 0;

async function main() {
  const browser = await chromium.launch({ headless: true, args: GL });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const api = (fn, arg) => page.evaluate(fn, arg);
  const shot = async (name, wait = 400) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${OUT}r2-${String(++n).padStart(2, '0')}-${name}.png` });
    console.log(`  📸 r2-${String(n).padStart(2, '0')}-${name}.png`);
  };

  console.log('▶ boot (home isle)…');
  await page.goto(URL_BASE);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => !!window.__realm?.store);
  await page.getByRole('button', { name: /Skip|Got it/ }).first().click().catch(() => {});
  await shot('saujana', 900); // HUD shows "Saujana Isle"

  console.log('▶ dock gate (locked before the Guardian falls)…');
  await api(() => window.__realm.playerPos.set(0, 0, 38)); // step onto the south jetty
  await shot('dock-locked', 700); // "strait too wild — best the Guardian first"

  console.log('▶ simulate beating Naris → dock opens…');
  await api(() => window.__realm.store.setState({ guardiansDefeated: ['saujana'] }));
  await shot('dock-unlocked', 600); // "Sail to Beringin Reach — press E"

  console.log('▶ sail across the strait…');
  await api(() => window.__realm.store.getState().interact()); // boards the dock → sailTo
  await shot('beringin-arrival', 1100); // grass-alt ground, banyan grove, "Beringin Reach"
  await api(() => window.__realm.playerPos.set(0, 0, 9)); // walk in among the grove + Reefwarden
  await shot('beringin-grove', 800);

  console.log('▶ Reefwarden + a new wild…');
  await api(() => window.__realm.store.getState().talkToNpc('reefwarden'));
  await shot('reefwarden', 500);
  await api(() => window.__realm.store.getState().closeDialogue());
  await api(() => { const g = window.__realm.store.getState(); g.setNearby('wild-ubur-2'); g.beginTaming('wild-ubur-2'); });
  await shot('taming-ubur', 500); // Ubur, ✨ Spirit, lantern-jellyfish
  await api(() => window.__realm.store.getState().cancelTaming());

  console.log('▶ Banyan-titan Guardian — Spirit counters Forest…');
  await api(({ team }) => window.__realm.store.setState({ party: team, treats: 12, guardiansDefeated: ['saujana'] }),
    { team: [mon('gambang', 24, 1), mon('ayaka', 24, 2), mon('penyu', 24, 3), mon('karang', 24, 4), mon('warking', 24, 5)] });
  await api(() => window.__realm.store.getState().beginBattle('guardian-banyan-0'));
  await shot('banyan-start', 800); // boss Banyan (Forest), team in the switch bar
  await api(() => window.__realm.store.getState().battleMove(0)); // Gambang Strike (Spirit×1.5) → boss fells it
  await shot('banyan-must-switch', 800); // forced switch
  await api(() => window.__realm.store.getState().battleSwitch(1)); // bring in Ayaka (Spirit)
  await api(() => window.__realm.store.getState().battleMove(0)); // Ayaka Strike → win
  await shot('banyan-win', 900); // "You bested the Guardian! +15 treats"
  console.log('   after:', JSON.stringify(await api(() => {
    const s = window.__realm.store.getState();
    return { region: s.currentRegion, treats: s.treats, guardians: s.guardiansDefeated, outcome: s.battle?.outcome };
  })));
  await api(() => window.__realm.store.getState().endBattle());

  console.log('▶ Field Guide — new species discovered…');
  await api(() => window.__realm.store.setState({ tamedWildIds: ['wild-karang-0', 'wild-penyu-1', 'wild-ubur-2', 'wild-warking-3', 'guardian-banyan-0'] }));
  await page.getByRole('button', { name: 'Field Guide' }).click();
  await shot('field-guide', 500); // 17 species; the Beringin roster unlocked with lore
  await page.getByRole('button', { name: 'Close' }).click();

  await browser.close();
  console.log(`\n✅ region-2 playtest complete — ${n} shots`);
  console.log(errors.length ? `❌ ${errors.length} errors:\n  ${errors.join('\n  ')}` : '✅ zero console/page errors');
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
