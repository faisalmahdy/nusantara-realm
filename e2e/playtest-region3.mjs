// Region-3 playtest: the harbor (set-sail) menu + gate, sailing to Cinder Peak,
// its ember biome (ashen ground, volcanic haze, charred trees, tinted "Bara"
// variant creatures), the Emberwarden, and the Bara Watua magma-Guardian (Earth,
// countered by Forest). Deterministic battle math → reliable forced-switch win.
// Run: node e2e/playtest-region3.mjs
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';

const OUT = new URL('./playtest-shots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const URL_BASE = 'http://localhost:4173/';
const GL = ['--no-sandbox', '--enable-unsafe-swiftshader', '--use-gl=angle', '--use-angle=swiftshader', '--ignore-gpu-blocklist'];
const BASE_HP = { matong: 34, bararabuas: 40, baraayaka: 34, barabamut: 50, karang: 42 };
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
    await page.screenshot({ path: `${OUT}r3-${String(++n).padStart(2, '0')}-${name}.png` });
    console.log(`  📸 r3-${String(n).padStart(2, '0')}-${name}.png`);
  };

  console.log('▶ boot…');
  await page.goto(URL_BASE);
  await page.waitForSelector('canvas');
  await page.waitForFunction(() => !!window.__realm?.store);
  await page.getByRole('button', { name: /Skip|Got it/ }).first().click().catch(() => {});

  console.log('▶ harbor menu (routes locked before their Guardians fall)…');
  await api(() => window.__realm.playerPos.set(0, 0, 38)); // step onto the jetty
  await page.waitForTimeout(300); // let the Dock arm nearDock
  await api(() => window.__realm.store.getState().interact()); // open the harbor
  await shot('harbor-locked', 600); // Beringin + Cinder Peak both 🔒

  console.log('▶ clear the chain → routes open…');
  await api(() => window.__realm.store.setState({ guardiansDefeated: ['saujana', 'beringin'] }));
  await shot('harbor-open', 500); // both sailable

  console.log('▶ sail to Cinder Peak…');
  await api(() => window.__realm.store.getState().sailTo('cinder'));
  await shot('cinder-arrival', 1200); // ashen ground, ember haze, "Cinder Peak"
  await api(() => window.__realm.playerPos.set(0, 0, 9));
  await shot('cinder-grove', 800); // charred trees + ember-tinted wilds + Emberwarden

  console.log('▶ Emberwarden + a Bara wild…');
  await api(() => window.__realm.store.getState().talkToNpc('emberwarden'));
  await shot('emberwarden', 500);
  await api(() => window.__realm.store.getState().closeDialogue());
  await api(() => { const g = window.__realm.store.getState(); g.setNearby('wild-baraayaka-1'); g.beginTaming('wild-baraayaka-1'); });
  await shot('taming-baraayaka', 500); // ember-tinted Bara Ayaka (Spirit)
  await api(() => window.__realm.store.getState().cancelTaming());

  console.log('▶ Bara Watua magma-Guardian — Forest counters Earth…');
  await api(({ team }) => window.__realm.store.setState({ party: team, treats: 12, guardiansDefeated: ['saujana', 'beringin'] }),
    { team: [mon('matong', 26, 1), mon('bararabuas', 26, 2), mon('baraayaka', 26, 3), mon('barabamut', 26, 4), mon('karang', 26, 5)] });
  await api(() => window.__realm.store.getState().beginBattle('guardian-barawatua-0'));
  await shot('watua-start', 800); // ember-tinted Earth titan; Bara forms in the switch bar
  await api(() => window.__realm.store.getState().battleMove(0)); // Matong Strike (Forest×1.5) → boss fells it
  await shot('watua-must-switch', 800);
  await api(() => window.__realm.store.getState().battleSwitch(1)); // bring in Bara Rabuas (Forest)
  await api(() => window.__realm.store.getState().battleMove(0)); // → win
  await shot('watua-win', 900);
  console.log('   after:', JSON.stringify(await api(() => {
    const s = window.__realm.store.getState();
    return { region: s.currentRegion, treats: s.treats, guardians: s.guardiansDefeated, outcome: s.battle?.outcome };
  })));
  await api(() => window.__realm.store.getState().endBattle());

  console.log('▶ Field Guide — Bara forms discovered…');
  await api(() => window.__realm.store.setState({ tamedWildIds: ['wild-barabamut-0', 'wild-baraayaka-1', 'wild-baracamar-2', 'wild-bararabuas-3', 'guardian-barawatua-0'] }));
  await page.getByRole('button', { name: 'Field Guide' }).click();
  await shot('field-guide', 500); // 22 species; Bara forms unlocked + ember-tinted
  await page.getByRole('button', { name: 'Close' }).click().catch(() => {});

  await browser.close();
  console.log(`\n✅ region-3 playtest complete — ${n} shots`);
  console.log(errors.length ? `❌ ${errors.length} errors:\n  ${errors.join('\n  ')}` : '✅ zero console/page errors');
}
main().catch((e) => { console.error('FAILED:', e); process.exit(1); });
