// Leonida Legend — gta6-trophy-guide-01 entry hand-in (Node 22, standard library only).
//
// The guide itself is plain static files under app/ (index.html, app.js,
// style.css and data/trophies.json), served with no build step and loading
// nothing over the network. This program hands it in: it copies app/ and
// screenshots/ from beside this file into the output directory and writes
// output/dossier.json with the vendored make.fun library, so the judge can
// read the entry back byte for byte.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const REPO_DIR = dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// The bounty's caps for the dossier: the text budget for the sources the
// judge reads, at most 4 screenshots of at most 256 KiB each, and the app
// size limits from the competition's gate.
const CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
};

function emptyDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
    return;
  }
  for (const name of ['app', 'screenshots', 'dossier.json']) {
    const target = join(dir, name);
    if (existsSync(target)) rmSync(target, { recursive: true, force: true });
  }
}

function main() {
  // Pre-flight: fail early with a plain message when the entry is
  // incomplete, instead of halfway through the hand-in.
  const indexHtml = join(REPO_DIR, 'app', 'index.html');
  if (!existsSync(indexHtml)) throw new Error('missing app/index.html');
  const shots = readdirSync(join(REPO_DIR, 'screenshots'))
    .filter((name) => /\.(png|jpe?g)$/i.test(name));
  if (shots.length < 3 || shots.length > 4) {
    throw new Error('screenshots/ must hold 3 or 4 images, found ' + shots.length);
  }
  for (const name of shots) {
    const bytes = statSync(join(REPO_DIR, 'screenshots', name)).size;
    if (bytes > 262144) throw new Error('screenshot ' + name + ' is over 256 KiB (' + bytes + ' bytes)');
  }
  emptyDir(OUTPUT_DIR);
  cpSync(join(REPO_DIR, 'app'), join(OUTPUT_DIR, 'app'), { recursive: true });
  cpSync(join(REPO_DIR, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });
  const dossier = buildDossier(OUTPUT_DIR, CAPS);
  // Determinism guard: building the same directory twice must spell the
  // same bytes. buildDossier returns a Uint8Array, so decode both builds
  // to text first and compare the strings with !== — comparing the byte
  // arrays themselves would compare object identity, not content.
  const decoder = new TextDecoder();
  const dossierText = decoder.decode(dossier);
  const dossierAgainText = decoder.decode(buildDossier(OUTPUT_DIR, CAPS));
  if (dossierText !== dossierAgainText) {
    throw new Error('dossier is not deterministic: two builds of the same directory differ');
  }
  writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);
  console.log('wrote ' + join(OUTPUT_DIR, 'dossier.json') + ' (' + dossier.length + ' bytes)');
}

main();
