/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const payments = app.findCollectionByNameOrId('payments');
		// Persist the gateway lease so concurrent requests and restarts share it.
		payments.fields.add(new DateField({ name: 'status_check_after', hidden: true }));
		payments.fields.add(
			new NumberField({ name: 'status_check_failures', min: 0, onlyInt: true, hidden: true })
		);
		app.save(payments);
	},
	() => {
		throw new Error('Pertahankan status rekonsiliasi pembayaran. Gunakan migration koreksi.');
	}
);
