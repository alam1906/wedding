/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		if (!theme.values.includes('anomali')) {
			theme.values = [...theme.values, 'anomali'];
		}
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		theme.values = theme.values.filter((value) => value !== 'anomali');
		return app.save(collection);
	}
);
