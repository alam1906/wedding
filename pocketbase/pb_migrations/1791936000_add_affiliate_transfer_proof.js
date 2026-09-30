/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const payouts = app.findCollectionByNameOrId('affiliate_payouts');
		payouts.fields.add(
			new FileField({
				name: 'transfer_proof',
				maxSelect: 1,
				maxSize: 5 * 1024 * 1024,
				mimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
				protected: true,
				// Historical paid payouts remain valid; the hook requires proof for new payments.
				required: false
			})
		);
		app.save(payouts);
	},
	() => {
		throw new Error('Bukti transfer merupakan riwayat keuangan. Gunakan migration koreksi.');
	}
);
