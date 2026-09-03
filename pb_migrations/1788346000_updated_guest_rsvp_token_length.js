/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2047001084');
		const tokenField = collection.fields.getByName('rsvp_token');

		tokenField.min = 12;

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2047001084');
		const tokenField = collection.fields.getByName('rsvp_token');

		tokenField.min = 32;

		return app.save(collection);
	}
);
