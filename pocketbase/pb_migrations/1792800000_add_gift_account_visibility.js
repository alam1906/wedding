/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const weddings = app.findCollectionByNameOrId('weddings');
		// False keeps both existing and newly created accounts visible by default.
		weddings.fields.add(new BoolField({ name: 'groom_gift_hidden' }));
		weddings.fields.add(new BoolField({ name: 'bride_gift_hidden' }));
		app.save(weddings);
	},
	() => {
		throw new Error('Pilihan tampilan rekening harus dipertahankan. Gunakan migration koreksi.');
	}
);
