// Deeper exploratory playtest — covers what the first pass didn't: real
// keyboard walking (walk-cycle frames), the beach/ocean shore, the other two
// camp NPCs, the ranch loop (feed→bond, rest→HP, and a Stage-2 evolution), the
// out-of-treats economy guard, and the day→dusk→night lighting cycle.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = new URL('./playtest-shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const URL_BASE = 'http://localhost:4173/';
const GL_ARGS = ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];
const errors = [];
let n = 0;

async function main() {
  const browser = await chromium.launch({ headless: true, args: GL_ARGS });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`console.error: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  const api = (fn, arg) => page.evaluate(fn, arg);
  const shot = async (name, wait = 350) => {
    await page.waitForTimeout(wait);
    await page.screenshot({ path: `${OUT}d${String(++n).padStart(2, '0')}-${name}.png` });
    console.log(`  📸 d${String(n).padStart(2, '0')}-${name}.png`);
  };

  console.log('▶ boot…');
  await page.goto(URL_BASE);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => !!window.__realm?.store);
  const t0 = Date.now(); // ~render start, for day/night timing
  await page.getByRole('button', { name: /Skip|Got it/ }).first().click().catch(() => {});
  // A small party so the ranch panel has something to feed/rest/evolve.
  await api(() => window.__realm.store.setState({ treats: 5, party: [
    { uid: 'r0', speciesId: 'matong', nickname: 'Matong', level: 7, xp: 64, bond: 40, hp: 20 }, // one feed → Lv8 → Stage 2
    { uid: 'r1', speciesId: 'camar',  nickname: 'Camar',  level: 5, xp: 0,  bond: 20, hp: 10 }, // worn down → rest demo
  ] }));
  await shot('daytime', 800); // midday island

  console.log('▶ walk (real keyboard, walk-cycle frame)…');
  await page.keyboard.down('w');
  await page.waitForTimeout(650);
  const moved = await api(() => ({ x: +window.__realm.playerPos.x.toFixed(1), z: +window.__realm.playerPos.z.toFixed(1) }));
  await page.screenshot({ path: `${OUT}d${String(++n).padStart(2, '0')}-walking.png` });
  console.log(`  📸 d${String(n).padStart(2,'0')}-walking.png  (player now at ${JSON.stringify(moved)})`);
  await page.keyboard.up('w');

  console.log('▶ beach / ocean shore…');
  await api(() => window.__realm.playerPos.set(12, 0, 42)); // near the south shore
  await shot('beach-ocean', 700);
  await api(() => window.__realm.playerPos.set(0, 0, 8)); // back to camp

  console.log('▶ the other two camp NPCs…');
  await api(() => window.__realm.store.getState().talkToNpc('elder'));
  await shot('npc-elder-sari');
  await api(() => window.__realm.store.getState().closeDialogue());
  await api(() => window.__realm.store.getState().talkToNpc('fisher'));
  await shot('npc-fisher-bayu');
  await api(() => window.__realm.store.getState().closeDialogue());

  console.log('▶ ranch: evolution (feed across Lv8) + rest…');
  await page.getByRole('button', { name: /Party/ }).click();
  await shot('ranch-before'); // Matong Lv7 Stage 1, both worn down
  await api(() => window.__realm.store.getState().feed('r0')); // +xp crosses Lv8 → Stage 2 evolution
  await shot('ranch-evolve', 250); // "evolved into its Stage 2 form!" flash + badge
  await api(() => window.__realm.store.getState().rest('r1')); // worn Camar → full HP
  await shot('ranch-rest', 250); // "fully rested" + HP bar refilled
  await page.getByRole('button', { name: /Party/ }).click(); // close panel

  console.log('▶ economy guard: taming with zero treats…');
  await api(() => { const g = window.__realm.store.getState(); g.flash(''); window.__realm.store.setState({ treats: 0 }); g.setNearby('wild-ayaka-6'); g.beginTaming('wild-ayaka-6'); });
  await shot('out-of-treats'); // rarity-3 Ayaka modal, Tame disabled ("No treats left")
  await api(() => window.__realm.store.getState().cancelTaming());

  console.log('▶ day → dusk → night lighting…');
  const waitUntil = async (ms) => { const left = ms - (Date.now() - t0); if (left > 0) await page.waitForTimeout(left); };
  await waitUntil(30000); // ~sunset glow
  await shot('dusk', 300);
  await waitUntil(60000); // ~midnight
  await shot('night', 300);

  await browser.close();
  console.log(`\n✅ deep pass complete — ${n} shots`);
  console.log(errors.length ? `❌ ${errors.length} errors:\n  ${errors.join('\n  ')}` : '✅ zero console/page errors');
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
