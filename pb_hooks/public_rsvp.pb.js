routerAdd(
	'POST',
	'/api/wedez/rsvp/guest',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		e.response.header().set('X-Content-Type-Options', 'nosniff');

		var data = new DynamicModel({ slug: '', token: '' });
		e.bindBody(data);

		var slug = typeof data.slug === 'string' ? data.slug.trim() : '';
		var token = typeof data.token === 'string' ? data.token.trim() : '';

		if (!slug || slug.length > 200 || !/^[A-Za-z0-9_-]{6,64}$/.test(token)) {
			throw new BadRequestError('Tautan RSVP tidak valid atau tidak lengkap.');
		}

		var guest;
		var wedding;

		try {
			guest = e.app.findFirstRecordByData('guests', 'rsvp_token', token);
			wedding = e.app.findRecordById('weddings', String(guest.get('wedding') || ''));
		} catch {
			throw new NotFoundError('Tautan RSVP tidak ditemukan.');
		}

		if (String(wedding.get('slug') || '') !== slug) {
			throw new NotFoundError('Tautan RSVP tidak ditemukan.');
		}

		var status = String(guest.get('rsvp_status') || 'pending');

		if (status !== 'attending' && status !== 'not_attending') {
			status = 'pending';
		}

		return e.json(200, {
			name: String(guest.get('name') || 'Tamu Undangan'),
			rsvp_status: status,
			message: String(guest.get('message') || '')
		});
	},
	$apis.bodyLimit(4096)
);

routerAdd(
	'POST',
	'/api/wedez/rsvp/respond',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		e.response.header().set('X-Content-Type-Options', 'nosniff');

		var data = new DynamicModel({
			slug: '',
			token: '',
			rsvp_status: '',
			message: ''
		});
		e.bindBody(data);

		var slug = typeof data.slug === 'string' ? data.slug.trim() : '';
		var token = typeof data.token === 'string' ? data.token.trim() : '';
		var status = typeof data.rsvp_status === 'string' ? data.rsvp_status.trim() : '';
		var message = typeof data.message === 'string' ? data.message.trim() : '';

		if (!slug || slug.length > 200 || !/^[A-Za-z0-9_-]{6,64}$/.test(token)) {
			throw new BadRequestError('Tautan RSVP tidak valid atau tidak lengkap.');
		}

		if (status !== 'attending' && status !== 'not_attending') {
			throw new BadRequestError('Pilih konfirmasi kehadiran terlebih dahulu.');
		}

		if (message.length > 1000) {
			throw new BadRequestError('Pesan maksimal 1000 karakter.');
		}

		var guest;
		var wedding;

		try {
			guest = e.app.findFirstRecordByData('guests', 'rsvp_token', token);
			wedding = e.app.findRecordById('weddings', String(guest.get('wedding') || ''));
		} catch {
			throw new NotFoundError('Tautan RSVP tidak ditemukan.');
		}

		if (String(wedding.get('slug') || '') !== slug) {
			throw new NotFoundError('Tautan RSVP tidak ditemukan.');
		}

		guest.set('rsvp_status', status);
		guest.set('message', message);
		e.app.save(guest);

		return e.json(200, {
			name: String(guest.get('name') || 'Tamu Undangan'),
			rsvp_status: status,
			message: String(guest.get('message') || '')
		});
	},
	$apis.bodyLimit(4096)
);

routerAdd(
	'POST',
	'/api/wedez/rsvp/messages',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		e.response.header().set('X-Content-Type-Options', 'nosniff');

		var data = new DynamicModel({ slug: '', page: 1 });
		e.bindBody(data);

		var slug = typeof data.slug === 'string' ? data.slug.trim() : '';
		var page = Math.max(1, Math.floor(Number(data.page) || 1));
		var pageSize = 8;

		if (!slug || slug.length > 200 || page > 10000) {
			throw new BadRequestError('Permintaan ucapan tidak valid.');
		}

		var wedding;

		try {
			wedding = e.app.findFirstRecordByData('weddings', 'slug', slug);
		} catch {
			throw new NotFoundError('Undangan tidak ditemukan.');
		}

		var records = e.app.findRecordsByFilter(
			'guests',
			"wedding = {:wedding} && message != ''",
			'id',
			pageSize + 1,
			(page - 1) * pageSize,
			{ wedding: wedding.id }
		);
		var items = [];

		for (var index = 0; index < records.length && index < pageSize; index++) {
			var record = records[index];
			var status = String(record.get('rsvp_status') || 'pending');

			if (status !== 'attending' && status !== 'not_attending') {
				status = 'pending';
			}

			items.push({
				name: String(record.get('name') || 'Tamu Undangan'),
				message: String(record.get('message') || ''),
				rsvp_status: status
			});
		}

		return e.json(200, {
			items: items,
			has_more: records.length > pageSize
		});
	},
	$apis.bodyLimit(2048)
);
