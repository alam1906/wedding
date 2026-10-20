onRecordValidate(function (e) {
	var slug = e.record.getString('slug');
	// Do not rename or invalidate existing invitations during an unrelated edit.
	if (slug && (e.record.isNew() || slug !== e.record.original().getString('slug'))) {
		var reserved = ['api', 'app', 'admin', 'dokploy', 'mail', 'status', 'web', 'wedding', 'www'];
		if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(slug) || reserved.indexOf(slug) !== -1) {
			throw new BadRequestError('Subdomain tidak valid atau digunakan oleh sistem.', {
				slug: new ValidationError(
					'validation_invalid_slug',
					'Pilih subdomain lain dengan huruf kecil, angka, atau tanda hubung (maksimal 63 karakter).'
				)
			});
		}
	}
	e.next();
}, 'weddings');

// Redaction alone still permits boolean inference via filters, sorts and
// relation joins (for example wedding.whatsapp_template on wedding_stories).
// No application screen searches or sorts by this private field.
onRecordsListRequest(function (e) {
	if (!e.hasSuperuserAuth()) {
		var query = e.requestInfo().query;
		var expression = String(query.filter || '') + ' ' + String(query.sort || '');
		if (expression.toLowerCase().indexOf('whatsapp_template') !== -1) {
			throw new ForbiddenError('Pencarian berdasarkan template privat tidak diizinkan.');
		}
	}
	e.next();
});

// Projections in the invitation client are not an authorization boundary.
// This also redacts expanded records and realtime payloads for non-owners.
onRecordEnrich(function (e) {
	var auth = e.requestInfo && e.requestInfo.auth;
	if (!auth || (!auth.isSuperuser() && auth.id !== e.record.getString('owner'))) {
		e.record.hide('whatsapp_template');
		for (var i = 0; i < 2; i++) {
			var person = i === 0 ? 'groom' : 'bride';
			if (e.record.getBool(person + '_gift_hidden')) {
				e.record.hide(person + '_payment_number');
				e.record.hide(person + '_payment_provider');
				e.record.hide(person + '_payment_account_name');
			}
		}
	}
	e.next();
}, 'weddings');
