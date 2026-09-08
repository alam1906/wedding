/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const payments = app.findCollectionByNameOrId('payments');

		payments.fields.add(
			new TextField({
				name: 'provider_reference',
				max: 255
			})
		);
		payments.fields.add(
			new URLField({
				name: 'checkout_url'
			})
		);
		payments.fields.add(
			new AutodateField({
				name: 'created',
				onCreate: true,
				onUpdate: false
			})
		);
		payments.fields.add(
			new AutodateField({
				name: 'updated',
				onCreate: true,
				onUpdate: true
			})
		);

		return app.save(payments);
	},
	(app) => {
		const payments = app.findCollectionByNameOrId('payments');

		payments.fields.removeByName('provider_reference');
		payments.fields.removeByName('checkout_url');
		payments.fields.removeByName('created');
		payments.fields.removeByName('updated');

		return app.save(payments);
	}
);
