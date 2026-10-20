// Owner-only read models. Return counts and completion flags instead of private records.
function ownedWedding(e) {
	if (!e.auth || !e.auth.getBool('verified')) {
		throw new ForbiddenError('Verifikasi email terlebih dahulu.');
	}
	var records = e.app.findRecordsByFilter('weddings', 'owner = {:owner}', '', 1, 0, {
		owner: e.auth.id
	});
	if (!records.length) throw new NotFoundError('Undangan untuk akun ini tidak ditemukan.');
	return records[0];
}

function weddingSummary(app, wedding) {
	var stories = new DynamicModel({ total: 0, complete: 0 });
	app
		.db()
		.newQuery(
			"SELECT COUNT(*) AS total, COALESCE(SUM(CASE WHEN trim(title) != '' " +
				"AND trim(content) != '' AND date != '' AND image != '' THEN 1 ELSE 0 END), 0) AS complete " +
				'FROM wedding_stories WHERE wedding = {:wedding}'
		)
		.bind({ wedding: wedding.id })
		.one(stories);
	function filled(field) {
		return wedding.getString(field).trim().length > 0;
	}
	function all(fields) {
		return fields.every(filled);
	}
	var groomGift = ['groom_payment_number', 'groom_payment_provider', 'groom_payment_account_name'];
	var brideGift = ['bride_payment_number', 'bride_payment_provider', 'bride_payment_account_name'];
	var gift = wedding.getBool('gift_enabled');
	var groomHidden = wedding.getBool('groom_gift_hidden');
	var brideHidden = wedding.getBool('bride_gift_hidden');
	var separate = wedding.getBool('separate_events');
	var fields = [
		'theme',
		'groom_name',
		'groom_father_name',
		'groom_mother_name',
		'groom_photo',
		'bride_name',
		'bride_father_name',
		'bride_mother_name',
		'bride_photo',
		'cover',
		'quote',
		'address',
		'maps',
		'akad',
		'reception'
	];
	if (gift && !groomHidden) fields = fields.concat(groomGift);
	if (gift && !brideHidden) fields = fields.concat(brideGift);
	if (separate) fields.push('reception_address');
	var gallery = wedding.getStringSlice('gallery').length > 0;
	var completed = fields.filter(filled).length + (gallery ? 1 : 0) + (stories.total > 0 ? 1 : 0);
	var total = fields.length + 2;
	return {
		id: wedding.id,
		slug: wedding.getString('slug'),
		plan_tier: wedding.getString('plan_tier') === 'pro' ? 'pro' : 'free',
		completion: {
			completedFields: completed,
			totalFields: total,
			percentage: Math.round((completed / total) * 100)
		},
		sections: {
			Domain: wedding.getString('slug').trim().length >= 3,
			Mempelai: all([
				'groom_name',
				'groom_father_name',
				'groom_mother_name',
				'groom_photo',
				'bride_name',
				'bride_father_name',
				'bride_mother_name',
				'bride_photo'
			]),
			Acara: all(['akad', 'reception', 'address']) && (!separate || filled('reception_address')),
			Media: filled('cover') && gallery,
			Story: stories.total > 0 && stories.total === stories.complete,
			Quote: filled('quote'),
			Kado: !gift || ((groomHidden || all(groomGift)) && (brideHidden || all(brideGift))),
			Musik: filled('music'),
			Tema: filled('theme')
		}
	};
}

function guestStats(app, weddingId) {
	var stats = new DynamicModel({ total: 0, attending: 0, notAttending: 0, pending: 0 });
	var count = 'MAX(1, CAST(COALESCE(guest_count, 1) AS INTEGER))';
	app
		.db()
		.newQuery(
			'SELECT COALESCE(SUM(' +
				count +
				'), 0) AS total, ' +
				"COALESCE(SUM(CASE WHEN rsvp_status = 'attending' THEN " +
				count +
				' ELSE 0 END), 0) AS attending, ' +
				"COALESCE(SUM(CASE WHEN rsvp_status = 'not_attending' THEN " +
				count +
				' ELSE 0 END), 0) AS notAttending, ' +
				"COALESCE(SUM(CASE WHEN COALESCE(rsvp_status, 'pending') NOT IN ('attending', 'not_attending') THEN " +
				count +
				' ELSE 0 END), 0) AS pending ' +
				'FROM guests WHERE wedding = {:wedding}'
		)
		.bind({ wedding: weddingId })
		.one(stats);
	return stats;
}

module.exports = {
	ownedWedding: ownedWedding,
	weddingSummary: weddingSummary,
	guestStats: guestStats
};
