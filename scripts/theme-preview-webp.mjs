import { execFile } from 'node:child_process';
import { readFile, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { promisify } from 'node:util';

const run = promisify(execFile);

// Uses the existing system WebP encoder; no application dependency is needed.
// Preserve the 1200 x 900 capture resolution so small text stays legible.
export async function encodeThemePreview(source, destination) {
	const temporary = `${destination}.${randomUUID()}.tmp`;
	try {
		await run(process.env.CWEBP_BINARY || 'cwebp', [
			'-quiet',
			'-q',
			'82',
			'-m',
			'6',
			'-sharp_yuv',
			'-metadata',
			'none',
			source,
			'-o',
			temporary
		]);
		const encoded = await readFile(temporary);
		if (encoded.toString('ascii', 0, 4) !== 'RIFF' || encoded.toString('ascii', 8, 12) !== 'WEBP') {
			throw new Error(`Invalid WebP output: ${destination}`);
		}
		await rename(temporary, destination);
		return encoded.length;
	} finally {
		await rm(temporary, { force: true });
	}
}
