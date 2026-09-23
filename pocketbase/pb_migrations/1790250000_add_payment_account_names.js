/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		for (const name of ['groom_payment_account_name', 'bride_payment_account_name']) {
			collection.fields.add(new Field({ name, type: 'text', required: false }));
		}
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		for (const name of ['groom_payment_account_name', 'bride_payment_account_name']) {
			collection.fields.removeByName(name);
		}
		return app.save(collection);
	}
);
