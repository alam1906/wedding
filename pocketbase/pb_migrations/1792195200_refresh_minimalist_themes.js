/// <reference path="../pb_data/types.d.ts" />
// Keep existing minimalist-1 weddings on the same key; only the renderer changes.
// Reconcile the theme enum with the current catalog without modifying wedding records.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		const supported = [
			'neubrutalism-1',
			'neubrutalism-2',
			'neubrutalism-3',
			'playful-1',
			'playful-2',
			'playful-3',
			'3d-design-1',
			'3d-design-2',
			'3d-design-3',
			'nocturne',
			'kinetika',
			'anomali',
			'selaras',
			'pramesti',
			'seruni',
			'arsir',
			'kusuma',
			'aurelia',
			'arunika',
			'zamrud',
			'cendana',
			'lentera',
			'safira',
			'renjana',
			'monokrom',
			'swarna',
			'sonata',
			'jelajah',
			'folio',
			'pusaka',
			'sinema',
			'adikara',
			'komika',
			'warta',
			'retro',
			'kristal',
			'amerta',
			'niskala',
			'sakura',
			'lazuardi',
			'melati',
			'eukaliptus',
			'jingga',
			'peony',
			'gardenia',
			'aster',
			'minimalist-1',
			'minimalist-2',
			'minimalist-3',
			'minimalist-4',
			'minimalist-5',
			'minimalist-6',
			'minimalist-7'
		];
		const retired = field.values.filter((key) => !supported.includes(key));
		if (retired.length) {
			const filter = retired.map((key) => 'theme = ' + JSON.stringify(key)).join(' || ');
			if (app.findRecordsByFilter('weddings', filter, '', 1, 0).length) {
				throw new Error(
					'A wedding still uses a retired theme. Resolve its theme explicitly before migrating.'
				);
			}
		}
		field.values = supported;
		return app.save(collection);
	},
	() => {
		throw new Error(
			'This catalog replacement is forward-only. Restore the pre-migration backup to roll back.'
		);
	}
);
