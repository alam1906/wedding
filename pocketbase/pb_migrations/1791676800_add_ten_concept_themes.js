/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		const additions = [
			'sonata',
			'jelajah',
			'folio',
			'pusaka',
			'sinema',
			'adikara',
			'komika',
			'warta',
			'retro',
			'kristal'
		];
		theme.values = [...theme.values, ...additions.filter((key) => !theme.values.includes(key))];
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		const additions = [
			'sonata',
			'jelajah',
			'folio',
			'pusaka',
			'sinema',
			'adikara',
			'komika',
			'warta',
			'retro',
			'kristal'
		];
		theme.values = theme.values.filter((key) => !additions.includes(key));
		return app.save(collection);
	}
);
