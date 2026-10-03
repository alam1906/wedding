/// <reference path="../pb_data/types.d.ts" />
// Extend the select field only. Do not modify weddings or their selected themes.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		const added = [
			'post-wedding-1',
			'wedding-anniversary-1',
			'islamic-1',
			'islamic-2',
			'luxury-2',
			'luxury-1',
			'wedding-shower-1',
			'bachelorette-1',
			'rehearsal-dinner-1'
		];
		field.values = [...new Set([...field.values, ...added])];
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		const added = [
			'post-wedding-1',
			'wedding-anniversary-1',
			'islamic-1',
			'islamic-2',
			'luxury-2',
			'luxury-1',
			'wedding-shower-1',
			'bachelorette-1',
			'rehearsal-dinner-1'
		];
		const filter = added.map((key) => 'theme = ' + JSON.stringify(key)).join(' || ');
		if (app.findRecordsByFilter('weddings', filter, '', 1, 0).length) {
			throw new Error('These themes are in use. Choose another theme before reverting.');
		}
		field.values = field.values.filter((key) => !added.includes(key));
		return app.save(collection);
	}
);
