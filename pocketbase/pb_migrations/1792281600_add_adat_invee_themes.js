/// <reference path="../pb_data/types.d.ts" />
// New regional editions. No wedding data, existing theme keys, or defaults change.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		const added = [
			'sumatera-utara',
			'sulawesi-selatan',
			'sumatera-barat',
			'jakarta',
			'jawa-barat',
			'jawa-tengah',
			'jawa-timur',
			'bali',
			'sunda',
			'dayak',
			'banjar'
		];
		field.values = [...new Set([...field.values, ...added])];
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		const added = [
			'sumatera-utara',
			'sulawesi-selatan',
			'sumatera-barat',
			'jakarta',
			'jawa-barat',
			'jawa-tengah',
			'jawa-timur',
			'bali',
			'sunda',
			'dayak',
			'banjar'
		];
		const filter = added.map((key) => 'theme = ' + JSON.stringify(key)).join(' || ');
		if (app.findRecordsByFilter('weddings', filter, '', 1, 0).length) {
			throw new Error(
				'Regional themes are in use. Choose another theme for those weddings before reverting.'
			);
		}
		field.values = field.values.filter((key) => !added.includes(key));
		return app.save(collection);
	}
);
