/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const weddings = app.findCollectionByNameOrId('weddings');
		weddings.fields.add(new BoolField({ name: 'separate_events' }));
		weddings.fields.add(new TextField({ name: 'reception_address', max: 2000 }));
		weddings.fields.add(new URLField({ name: 'reception_maps' }));
		app.save(weddings);
		// Preserve existing different-day schedules and their shared location (WIB).
		app
			.db()
			.newQuery(
				`UPDATE weddings SET separate_events = 1,
			reception_address = address, reception_maps = maps
			WHERE akad != '' AND reception != ''
			AND date(akad, '+7 hours') != date(reception, '+7 hours')`
			)
			.execute();
	},
	() => {
		throw new Error('Lokasi acara terpisah harus dipertahankan. Gunakan migration koreksi.');
	}
);
