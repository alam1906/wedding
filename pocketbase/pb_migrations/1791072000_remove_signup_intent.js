/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		const obsoleteRule = ' && @request.body.signup_intent:changed = false';
		if (!users.updateRule || !users.updateRule.includes(obsoleteRule)) {
			throw new Error('Aturan signup_intent yang diharapkan tidak ditemukan.');
		}
		users.updateRule = users.updateRule.replace(obsoleteRule, '');
		users.fields.removeByName('signup_intent');
		app.save(users);
	},
	() => {
		throw new Error('Data signup_intent lama tidak dapat dipulihkan melalui rollback.');
	}
);
