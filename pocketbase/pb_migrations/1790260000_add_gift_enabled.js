/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		collection.fields.add(new Field({ name: 'gift_enabled', type: 'bool' }));
		app.save(collection);
		app
			.db()
			.newQuery(
				"UPDATE weddings SET gift_enabled = TRUE WHERE trim(groom_payment_number) <> '' OR trim(bride_payment_number) <> ''"
			)
			.execute();
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		collection.fields.removeByName('gift_enabled');
		return app.save(collection);
	}
);
