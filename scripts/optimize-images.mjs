// Generate optimized, responsive station-image variants from the originals in
// public/assets/stations/original/. Outputs AVIF/WebP/PNG + crops (16:9, 21:9,
// square, portrait) + an inline blurred LQIP placeholder, and writes a manifest the
// app consumes via src/data/stationAssets.ts.
//
// Run: npm run images   (idempotent; safe to re-run)

import sharp from 'sharp';
import { mkdir, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const SRC_DIR = join(ROOT, 'public', 'assets', 'stations', 'original');
const OUT_DIR = join(ROOT, 'public', 'assets', 'stations', 'optimized');
const MANIFEST = join(ROOT, 'src', 'data', 'stationAssets.manifest.json');

/** key -> { file, label } */
const SOURCES = {
  admin: { file: 'admin.png', label: 'MBFD Command' },
  'station-1': { file: 'fire_station_1.png', label: 'Station 1 — South Beach' },
  'station-2': { file: 'fire_station_2.png', label: 'Station 2 — Mid-Beach South' },
  'station-3': { file: 'fire_station_3.png', label: 'Station 3 — Mid-Beach' },
  'station-4': { file: 'fire_station_4.png', label: 'Station 4 — North Beach' },
  'station-6': { file: 'fire_station_6.png', label: 'Station 6 — Marine' },
};

const VARIANTS = [
  { name: 'full', w: 2000, h: null, formats: ['avif', 'webp', 'png'], fit: 'inside' },
  { name: 'hero', w: 1920, h: 1080, formats: ['avif', 'webp'], fit: 'cover' },
  { name: 'wide', w: 2560, h: 1080, formats: ['avif', 'webp'], fit: 'cover' },
  { name: 'square', w: 600, h: 600, formats: ['webp'], fit: 'cover' },
  { name: 'portrait', w: 1080, h: 1920, formats: ['avif', 'webp'], fit: 'cover' },
];

const Q = { avif: 58, webp: 78, png: 80 };

async function emit(input, key, variant) {
  const dir = join(OUT_DIR, key);
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
  const out = {};
  for (const fmt of variant.formats) {
    const pipeline = sharp(input).resize({
      width: variant.w,
      height: variant.h ?? undefined,
      fit: variant.fit,
      withoutEnlargement: true,
      position: 'attention',
    });
    if (fmt === 'avif') pipeline.avif({ quality: Q.avif, effort: 4 });
    if (fmt === 'webp') pipeline.webp({ quality: Q.webp });
    if (fmt === 'png') pipeline.png({ quality: Q.png, compressionLevel: 9 });
    const file = join(dir, `${variant.name}.${fmt}`);
    await pipeline.toFile(file);
    out[fmt] = `/assets/stations/optimized/${key}/${variant.name}.${fmt}`;
  }
  return out;
}

async function lqip(input) {
  const buf = await sharp(input).resize(24).blur(1.2).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

async function dominantColor(input) {
  const { dominant } = await sharp(input).stats();
  const hex = (n) => n.toString(16).padStart(2, '0');
  return `#${hex(dominant.r)}${hex(dominant.g)}${hex(dominant.b)}`;
}

async function main() {
  const manifest = {};
  for (const [key, meta] of Object.entries(SOURCES)) {
    const input = join(SRC_DIR, meta.file);
    if (!existsSync(input)) {
      console.warn(`! missing source for ${key}: ${meta.file} — skipped`);
      continue;
    }
    const probe = await sharp(input).metadata();
    const entry = { key, label: meta.label, width: probe.width, height: probe.height };
    for (const v of VARIANTS) entry[v.name] = await emit(input, key, v);
    entry.lqip = await lqip(input);
    entry.color = await dominantColor(input);
    manifest[key] = entry;
    console.log(`✓ ${key} (${meta.file}) → ${VARIANTS.length} variants`);
  }
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n', 'utf8');
  console.log(`\nManifest written: ${MANIFEST} (${Object.keys(manifest).length} images)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
