/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		// Account removal must go through the authenticated confirmation route.
		users.deleteRule = null;
		app.save(users);

		const payments = app.findCollectionByNameOrId('payments');
		payments.fields.getByName('wedding').required = false;
		payments.fields.getByName('wedding').cascadeDelete = false;
		// Preserve the original grouping for late/repeated payment callbacks.
		payments.fields.add(new TextField({ name: 'archived_wedding_id', max: 15, hidden: true }));
		app.save(payments);

		const affiliates = app.findCollectionByNameOrId('affiliates');
		affiliates.fields.getByName('user').required = false;
		affiliates.fields.getByName('user').cascadeDelete = false;
		affiliates.indexes = affiliates.indexes.filter(
			(index) => !index.includes('idx_affiliates_user')
		);
		affiliates.indexes.push(
			"CREATE UNIQUE INDEX `idx_affiliates_user` ON `affiliates` (`user`) WHERE `user` != ''"
		);
		app.save(affiliates);
	},
	() => {
		throw new Error(
			'Riwayat keuangan akun terhapus harus dipertahankan. Gunakan migration koreksi.'
		);
	}
);
