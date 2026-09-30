/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		// The editor imports up to 50 guests and saves story changes atomically.
		// Every subrequest still goes through its collection rules and request hooks.
		const settings = app.settings();
		settings.batch.enabled = true;
		settings.batch.maxRequests = 50;
		settings.batch.timeout = 10;
		settings.batch.maxBodySize = 128 * 1024 * 1024;
		const labels = [
			'POST /api/wedez/rsvp/guest',
			'POST /api/wedez/rsvp/respond',
			'POST /api/wedez/rsvp/messages'
		];
		settings.rateLimits.enabled = true;
		for (const label of labels) {
			if (!settings.rateLimits.rules.some((rule) => rule.label === label)) {
				settings.rateLimits.rules.unshift({ label, duration: 60, maxRequests: 60 });
			}
		}
		app.save(settings);

		for (const [collectionName, fields] of [
			['weddings', ['cover', 'groom_photo', 'bride_photo', 'gallery']],
			['wedding_stories', ['image']],
			['users', ['avatar']]
		]) {
			const collection = app.findCollectionByNameOrId(collectionName);
			for (const fieldName of fields) {
				let field = collection.fields.getByName(fieldName);
				// Legacy users collections may not include the default profile photo field.
				if (!field && collectionName === 'users' && fieldName === 'avatar') {
					field = new FileField({ name: fieldName, maxSelect: 1 });
					collection.fields.add(field);
				}
				if (!field) {
					throw new Error(`Missing upload field: ${collectionName}.${fieldName}`);
				}
				field.mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
				field.maxSize = 10 * 1024 * 1024;
			}
			app.save(collection);
		}
		const guests = app.findCollectionByNameOrId('guests');
		guests.indexes.push('CREATE INDEX idx_guests_wedding_id ON guests (wedding, id)');
		app.save(guests);
		const stories = app.findCollectionByNameOrId('wedding_stories');
		stories.indexes.push(
			'CREATE INDEX idx_stories_wedding_order ON wedding_stories (wedding, sort_order, date, id)'
		);
		app.save(stories);
	},
	() => {
		throw new Error(
			'Gunakan migration koreksi agar batas upload dan perlindungan RSVP tetap berlaku.'
		);
	}
);
