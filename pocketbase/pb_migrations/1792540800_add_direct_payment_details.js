/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const payments = app.findCollectionByNameOrId('payments');
		for (const [name, max] of [
			['payment_method', 2],
			['payment_method_name', 255],
			['payment_kind', 10],
			['va_number', 40],
			['qr_string', 4096]
		]) {
			payments.fields.add(new TextField({ name, max }));
		}
		payments.fields.add(new NumberField({ name: 'payment_fee', min: 0, onlyInt: true }));
		app.save(payments);
		const settings = app.settings();
		settings.rateLimits.rules = [
			{ label: 'POST /api/wedez/payments/methods', duration: 60, maxRequests: 30 },
			{ label: 'GET /api/wedez/payments/status', duration: 60, maxRequests: 30 },
			...settings.rateLimits.rules
		];
		app.save(settings);
	},
	() => {
		throw new Error('Detail pembayaran aktif harus dipertahankan. Gunakan migration koreksi.');
	}
);
