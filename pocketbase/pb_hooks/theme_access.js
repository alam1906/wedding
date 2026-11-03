// Stable Free selection: adding/reordering catalog themes never unlocks more.
var FREE_THEME_KEYS = [
	'minimalist-1',
	'minimalist-2',
	'minimalist-3',
	'neubrutalism-1',
	'neubrutalism-2',
	'neubrutalism-3',
	'playful-1',
	'playful-2',
	'playful-3',
	'nocturne'
];

function enforceThemeAccess(record) {
	var theme = record.getString('theme');
	var changed = record.isNew() || theme !== record.original().getString('theme');
	// Preserve published legacy invitations and unrelated edits. Once switched
	// away, selecting a premium theme again requires Pro.
	if (
		changed &&
		theme &&
		record.getString('plan_tier') !== 'pro' &&
		FREE_THEME_KEYS.indexOf(theme) === -1
	) {
		throw new BadRequestError('Tema ini hanya tersedia untuk paket Pro.', {
			theme: new ValidationError(
				'theme_requires_pro',
				'Tema ini terkunci. Upgrade ke Pro untuk menggunakan semua tema.'
			)
		});
	}
}

module.exports = { freeThemeKeys: FREE_THEME_KEYS, enforceThemeAccess: enforceThemeAccess };
