/**
 * Rasterizes the authored icon SVGs into the PNG set the manifest and iOS need.
 *
 * Run manually with `pnpm icons` after editing an SVG. The outputs are
 * committed, so a normal build never needs sharp's native binaries.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const staticDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'static');

const OUTPUTS = [
	{ from: 'icon.svg', to: 'icon-192.png', size: 192 },
	{ from: 'icon.svg', to: 'icon-512.png', size: 512 },
	{ from: 'icon-maskable.svg', to: 'icon-maskable-512.png', size: 512 },
	// iOS ignores the manifest and squircle-crops this one, so it comes from the
	// full-bleed variant rather than the circular plate.
	{ from: 'icon-maskable.svg', to: 'apple-touch-icon.png', size: 180 }
];

for (const { from, to, size } of OUTPUTS) {
	const svg = readFileSync(join(staticDir, from));
	const png = await sharp(svg, { density: 384 })
		.resize(size, size)
		.png({ compressionLevel: 9 })
		.toBuffer();
	writeFileSync(join(staticDir, to), png);
	console.log(`${from} -> ${to} (${size}x${size}, ${png.length} bytes)`);
}
