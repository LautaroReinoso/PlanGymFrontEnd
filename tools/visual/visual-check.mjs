// ─────────────────────────────────────────────
//  PlanGym — chequeo visual con datos simulados
//  Sirve el build (dist/), simula el backend y saca capturas de las pantallas
//  principales en 360 / 390 / 768 / 1280 px. Falla (exit 1) si alguna pantalla
//  tiene scroll horizontal o errores de JavaScript.
//
//  Uso:  npm run visual            (hace ng build y corre)
//        node tools/visual/visual-check.mjs [filtro]   (solo las que contienen el filtro)
//  Primera vez en una máquina nueva:  npx playwright install chromium
//  Capturas en visual-output/ (no se versiona).
// ─────────────────────────────────────────────

import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, mkdir, readdir, stat } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { routes } from './mocks.mjs';

const API = 'https://api.plangympro.com/**';   // apiUrl del build de producción
const PORT = 4321;
const OUT = 'visual-output';
const WIDTHS = [360, 390, 768, 1280];

/** [nombre, rol, ruta, escenario, acción opcional] */
const SCREENS = [
  ['alumnos', 'trainer', '/trainer/students'],
  ['alumnos-turnos', 'trainer', '/trainer/students', 'turnos'],
  ['detalle-alumno', 'trainer', '/trainer/students/1'],
  ['detalle-plantilla', 'trainer', '/trainer/templates/7'],
  ['agregar-ejercicio', 'trainer', '/trainer/templates/7', 'default', 'text=Agregar ejercicio'],
  ['ejercicios', 'trainer', '/trainer/exercises'],
  ['inicio-alumno', 'student', '/student/dashboard'],
  ['inicio-sin-plan', 'student', '/student/dashboard', 'noplan'],
  ['inicio-semana-completa', 'student', '/student/dashboard', 'alldone'],
  ['semana-alumno', 'student', '/student/weekly'],
  ['login', null, '/login'],
  ['registro', null, '/register'],
];

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.woff2': 'font/woff2' };

async function findDist() {
  for (const d of await readdir('dist')) {
    const b = join('dist', d, 'browser');
    try { if ((await stat(b)).isDirectory()) return b; } catch { /* sigue */ }
  }
  throw new Error('No hay build: corré "ng build" primero.');
}

function serve(root) {
  return createServer(async (req, res) => {
    const path = decodeURIComponent(req.url.split('?')[0]);
    let file = join(root, path);
    try { if (!(await stat(file)).isFile()) throw 0; } catch { file = join(root, 'index.html'); }   // SPA
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    res.end(await readFile(file));
  }).listen(PORT);
}

function fakeToken(roles) {
  const b64 = o => Buffer.from(JSON.stringify(o)).toString('base64url');
  return `${b64({ alg: 'none' })}.${b64({ sub: 'demo@plangym', roles, exp: Math.floor(Date.now() / 1000) + 3600 })}.x`;
}

const filter = process.argv[2] ?? '';
const server = serve(await findDist());
await mkdir(OUT, { recursive: true });
const browser = await chromium.launch();
const problems = [];

for (const [name, role, path, scenario = 'default', click] of SCREENS.filter(s => s[0].includes(filter))) {
  for (const width of WIDTHS) {
    const ctx = await browser.newContext({ viewport: { width, height: 900 }, hasTouch: width < 700 });
    await ctx.route(API, r => {
      const url = r.request().url().split('?')[0];
      const res = routes.find(([re]) => re.test(url))[1](scenario);
      r.fulfill({ status: res.status ?? 200, contentType: 'application/json', body: JSON.stringify(res.body) });
    });
    if (role) {
      const roles = [role === 'trainer' ? 'ROLE_TRAINER' : 'ROLE_STUDENT'];
      await ctx.addInitScript(([token, roles]) => {
        const set = (k, v) => localStorage.setItem(k, JSON.stringify(v));
        set('gp_auth_token', token); set('gp_auth_mail', 'demo@plangym'); set('gp_auth_roles', roles);
        set('gp_auth_expires', Date.now() + 3_600_000);
      }, [fakeToken(roles), roles]);
    }
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`http://localhost:${PORT}${path}`);
    await page.waitForTimeout(1500);
    if (click) { await page.click(click); await page.waitForTimeout(600); }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    await page.screenshot({ path: join(OUT, `${name}-${width}.png`), fullPage: true });
    const tag = `${name} @ ${width}px`;
    if (overflow > 0) problems.push(`${tag}: scroll horizontal de ${overflow}px`);
    if (errors.length) problems.push(`${tag}: ${errors.join(' | ')}`);
    console.log(`${overflow > 0 || errors.length ? '✗' : '✓'} ${tag}`);
    await ctx.close();
  }
}

await browser.close();
server.close();
if (problems.length) { console.error('\nProblemas:\n- ' + problems.join('\n- ')); process.exit(1); }
console.log(`\nTodo bien. Capturas en ${OUT}/`);
