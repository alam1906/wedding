// Run with Bun so these assertions exercise the actual TypeScript helpers.
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
	formatEventCalendarDate,
	formatEventDate,
	formatStoryDate
} from '../apps/invitation/src/lib/features/wedding-themes/shared/theme-utils.ts';

const timeZones = ['Asia/Jakarta', 'Asia/Makassar', 'UTC', 'America/New_York'];

if (process.argv[2] === '--timezone') {
	const timeZone = process.argv[3];
	assert.equal(new Intl.DateTimeFormat().resolvedOptions().timeZone, timeZone);
	for (const value of ['2026-10-10 03:00:00.000Z', '2026-10-10T10:00:00+07:00']) {
		assert.deepEqual(formatEventDate(value), {
			date: 'Sabtu, 10 Oktober 2026',
			time: '10.00 WIB'
		});
		assert.deepEqual(formatEventCalendarDate(value), {
			day: '10',
			weekday: 'Sabtu',
			monthYear: 'Oktober 2026'
		});
	}
	// UTC and WIB can fall on different days, months, and years.
	assert.deepEqual(formatEventDate('2026-12-31 18:00:00.000Z'), {
		date: 'Jumat, 1 Januari 2027',
		time: '01.00 WIB'
	});
	assert.deepEqual(formatEventCalendarDate('2026-12-31 18:00:00.000Z'), {
		day: '01',
		weekday: 'Jumat',
		monthYear: 'Januari 2027'
	});
	assert.equal(formatStoryDate('2026-10-10 00:00:00.000Z'), '10 Oktober 2026');
	assert.equal(formatStoryDate('2026-01-01 00:00:00.000Z'), '1 Januari 2026');
	assert.equal(formatStoryDate('2024-02-29'), '29 Februari 2024');
	assert.deepEqual(formatEventDate(''), {
		date: 'Tanggal belum ditentukan',
		time: 'Waktu belum ditentukan'
	});
	assert.deepEqual(formatEventDate('invalid'), { date: 'invalid', time: '' });
	assert.equal(formatEventCalendarDate(''), null);
	assert.equal(formatEventCalendarDate('invalid'), null);
	assert.equal(formatStoryDate(''), '');
	assert.equal(formatStoryDate('invalid'), 'invalid');
	console.log(`PASS invitation event and story dates in ${timeZone}`);
} else {
	for (const timeZone of timeZones) {
		const result = spawnSync(
			process.execPath,
			[fileURLToPath(import.meta.url), '--timezone', timeZone],
			{
				env: { ...process.env, TZ: timeZone },
				encoding: 'utf8'
			}
		);
		assert.equal(result.status, 0, result.stderr || result.error?.message);
		process.stdout.write(result.stdout);
	}
	console.log(`Invitation dates: ${timeZones.length}/${timeZones.length} timezone groups passed.`);
}
