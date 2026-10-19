/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		// Preserve admin restrictions; only verified applications awaiting approval qualify.
		let pending;
		do {
			pending = app.findRecordsByFilter(
				'affiliates',
				"status = 'pending' && user.verified = true",
				'id',
				200
			);
			for (const affiliate of pending) {
				affiliate.set('status', 'active');
				app.save(affiliate);
			}
		} while (pending.length);
	},
	() => {
		throw new Error('Aktivasi affiliate tidak dibatalkan otomatis. Gunakan migration koreksi.');
	}
);
