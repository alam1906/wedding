routerAdd(
	'POST',
	'/api/wedez/account/provision',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var userId = e.auth.id;
		var weddingId = '';

		e.app.runInTransaction(function (txApp) {
			var user = txApp.findRecordById('users', userId);
			var existingWeddingId = String(user.get('wedding_id') || '');

			if (existingWeddingId) {
				txApp.findRecordById('weddings', existingWeddingId);
				weddingId = existingWeddingId;
				return;
			}

			var wedding = new Record(txApp.findCollectionByNameOrId('weddings'));
			wedding.set('owner', userId);
			wedding.set('slug', '');
			wedding.set('theme', 'minimalist-1');
			wedding.set('plan_tier', 'free');
			txApp.save(wedding);

			user.set('wedding_id', wedding.id);
			txApp.save(user);
			weddingId = wedding.id;
		});

		return e.json(200, { wedding_id: weddingId });
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);
