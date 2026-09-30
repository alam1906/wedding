import { mkdtemp, readdir, rename, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { encodeThemePreview } from './theme-preview-webp.mjs';

const directory = fileURLToPath(
	new URL('../apps/web/static/images/theme-previews/', import.meta.url)
);
const originals = (await readdir(directory)).filter((name) => /\.(?:jpe?g|png)$/i.test(name));
if (!originals.length) {
	console.log('All theme previews already use WebP.');
} else {
	const backup = await mkdtemp(join(tmpdir(), 'wedez-preview-originals-'));
	let before = 0;
	let after = 0;
	// Finish and validate every conversion before moving any originals out of the catalog.
	for (const name of originals) {
		const source = join(directory, name);
		before += (await stat(source)).size;
		after += await encodeThemePreview(source, join(directory, name.replace(/\.[^.]+$/, '.webp')));
	}
	for (const name of originals) await rename(join(directory, name), join(backup, name));
	console.log(
		JSON.stringify({
			converted: originals.length,
			before,
			after,
			savedPercent: Number(((1 - after / before) * 100).toFixed(1)),
			backup
		})
	);
}
