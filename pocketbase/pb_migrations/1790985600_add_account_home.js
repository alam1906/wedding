/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.fields.add(
			new SelectField({ name: 'home_area', maxSelect: 1, values: ['wedding', 'affiliate'] })
		);
		users.updateRule =
			'(' +
			users.updateRule +
			') && (@request.body.home_area:changed = false || @request.auth.verified = true)';
		app.save(users);

		// Existing users have already selected an area by creating a wedding or
		// joining the affiliate program. Fresh registrations keep an empty choice.
		app.db().newQuery("UPDATE users SET home_area = 'wedding' WHERE wedding_id != ''").execute();
		app
			.db()
			.newQuery(
				"UPDATE users SET home_area = 'affiliate' WHERE home_area = '' AND id IN (SELECT user FROM affiliates)"
			)
			.execute();
	},
	() => {
		throw new Error('Pilihan area akun harus dipertahankan. Gunakan migration koreksi.');
	}
);
