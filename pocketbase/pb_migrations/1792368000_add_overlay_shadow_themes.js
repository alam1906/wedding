/// <reference path="../pb_data/types.d.ts" />
// Only extend the theme options; existing weddings and selected themes stay unchanged.
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		field.values = [
			...new Set([...field.values, 'overlay-shadow-1', 'overlay-shadow-2', 'overlay-shadow-3'])
		];
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const field = collection.fields.getByName('theme');
		const added = ['overlay-shadow-1', 'overlay-shadow-2', 'overlay-shadow-3'];
		const filter = added.map((key) => 'theme = ' + JSON.stringify(key)).join(' || ');
		if (app.findRecordsByFilter('weddings', filter, '', 1, 0).length) {
			throw new Error('Overlay Shadow themes are in use. Choose another theme before reverting.');
		}
		field.values = field.values.filter((key) => !added.includes(key));
		return app.save(collection);
	}
);
