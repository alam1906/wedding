/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const guests = app.findCollectionByNameOrId('guests');
		// Scoped list ordering and CSV candidate lookups must not scan/sort
		// every guest in a wedding just to display one page.
		guests.indexes.push('CREATE INDEX idx_guests_wedding_name ON guests (wedding, name, id)');
		guests.indexes.push(
			'CREATE INDEX idx_guests_wedding_created ON guests (wedding, created_at, id)'
		);
		guests.indexes.push('CREATE INDEX idx_guests_wedding_whatsapp ON guests (wedding, whatsapp)');
		app.save(guests);
	},
	(app) => {
		const guests = app.findCollectionByNameOrId('guests');
		guests.indexes = guests.indexes.filter(
			(index) => !/idx_guests_wedding_(name|created|whatsapp)\b/.test(index)
		);
		app.save(guests);
	}
);
