/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		if (!theme.values.includes('puspa-parahyangan')) {
			theme.values = [...theme.values, 'puspa-parahyangan'];
		}
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		theme.values = theme.values.filter((value) => value !== 'puspa-parahyangan');
		return app.save(collection);
	}
);
