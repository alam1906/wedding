/// <reference path="../pb_data/types.d.ts" />

migrate(
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		const weddings = app.findCollectionByNameOrId('weddings');
		const stories = app.findCollectionByNameOrId('wedding_stories');
		const guests = app.findCollectionByNameOrId('guests');
		const payments = app.findCollectionByNameOrId('payments');

		weddings.fields.add(
			new RelationField({
				name: 'owner',
				collectionId: users.id,
				maxSelect: 1,
				cascadeDelete: true,
				hidden: true
			})
		);
		weddings.addIndex('idx_weddings_owner', true, 'owner', "owner != ''");
		app.save(weddings);

		const existingUsers = app.findRecordsByFilter('users', 'wedding_id != ""', '', 0, 0);
		for (const user of existingUsers) {
			const weddingId = String(user.get('wedding_id') || '');
			if (!weddingId) continue;

			try {
				const wedding = app.findRecordById('weddings', weddingId);
				if (!wedding.get('owner')) {
					wedding.set('owner', user.id);
					app.save(wedding);
				}
			} catch {
				// Keep orphaned user relations untouched so the migration remains deployable.
			}
		}

		const publicWeddingRule = 'slug != "" || (@request.auth.id != "" && owner = @request.auth.id)';
		weddings.listRule = publicWeddingRule;
		weddings.viewRule = publicWeddingRule;
		weddings.createRule =
			'@request.auth.id != "" && @request.body.owner = @request.auth.id && @request.body.plan_tier = "free"';
		weddings.updateRule =
			'@request.auth.id != "" && owner = @request.auth.id && @request.body.owner:changed = false && @request.body.plan_tier:changed = false';
		weddings.deleteRule = '@request.auth.id != "" && owner = @request.auth.id';

		for (const fieldName of ['groom_photo', 'bride_photo', 'cover', 'gallery']) {
			const field = weddings.fields.getByName(fieldName);
			field.mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
			field.thumbs = ['1200x800'];
		}
		app.save(weddings);

		users.updateRule =
			'id = @request.auth.id && (@request.body.wedding_id:changed = false || (wedding_id = "" && @collection.weddings.id ?= @request.body.wedding_id && @collection.weddings.owner ?= @request.auth.id))';
		app.save(users);

		const publicStoryRule =
			'wedding.slug != "" || (@request.auth.id != "" && wedding.owner = @request.auth.id)';
		const createOwnedRelationRule =
			'@request.auth.id != "" && @collection.weddings.id ?= @request.body.wedding && @collection.weddings.owner ?= @request.auth.id';
		const updateOwnedRelationRule =
			'@request.auth.id != "" && wedding.owner = @request.auth.id && @request.body.wedding:changed = false';
		const ownedRelationRule = '@request.auth.id != "" && wedding.owner = @request.auth.id';

		stories.listRule = publicStoryRule;
		stories.viewRule = publicStoryRule;
		stories.createRule = createOwnedRelationRule;
		stories.updateRule = updateOwnedRelationRule;
		stories.deleteRule = ownedRelationRule;
		const storyImage = stories.fields.getByName('image');
		storyImage.mimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
		storyImage.thumbs = ['1200x800'];
		app.save(stories);

		guests.listRule = ownedRelationRule;
		guests.viewRule = ownedRelationRule;
		guests.createRule = createOwnedRelationRule;
		guests.updateRule = updateOwnedRelationRule;
		guests.deleteRule = ownedRelationRule;
		app.save(guests);

		payments.listRule = ownedRelationRule;
		payments.viewRule = ownedRelationRule;
		payments.createRule = null;
		payments.updateRule = null;
		payments.deleteRule = null;
		app.save(payments);
	},
	(app) => {
		const users = app.findCollectionByNameOrId('users');
		users.updateRule = 'id = @request.auth.id';
		app.save(users);

		const stories = app.findCollectionByNameOrId('wedding_stories');
		stories.listRule = '';
		stories.viewRule = '';
		stories.createRule = '';
		stories.updateRule = '';
		stories.deleteRule = '';
		const storyImage = stories.fields.getByName('image');
		storyImage.mimeTypes = [];
		storyImage.thumbs = [];
		app.save(stories);

		const guests = app.findCollectionByNameOrId('guests');
		guests.listRule = '@request.auth.id != "" && wedding = @request.auth.wedding_id';
		guests.viewRule = '@request.auth.id != "" && wedding = @request.auth.wedding_id';
		guests.createRule =
			'@request.auth.id != "" && @request.body.wedding = @request.auth.wedding_id';
		guests.updateRule =
			'@request.auth.id != "" && wedding = @request.auth.wedding_id && (@request.body.wedding:isset = false || @request.body.wedding = @request.auth.wedding_id)';
		guests.deleteRule = '@request.auth.id != "" && wedding = @request.auth.wedding_id';
		app.save(guests);

		const payments = app.findCollectionByNameOrId('payments');
		payments.listRule = '@request.auth.id != "" && wedding = @request.auth.wedding_id';
		payments.viewRule = '@request.auth.id != "" && wedding = @request.auth.wedding_id';
		payments.createRule = null;
		payments.updateRule = null;
		payments.deleteRule = null;
		app.save(payments);

		const weddings = app.findCollectionByNameOrId('weddings');
		weddings.listRule = '';
		weddings.viewRule = '';
		weddings.createRule = '@request.auth.id != "" && @request.body.plan_tier = "free"';
		weddings.updateRule =
			'@request.auth.id != "" && id = @request.auth.wedding_id && @request.body.plan_tier:changed = false';
		weddings.deleteRule = '@request.auth.id != "" && id = @request.auth.wedding_id';
		for (const fieldName of ['groom_photo', 'bride_photo', 'cover', 'gallery']) {
			const field = weddings.fields.getByName(fieldName);
			field.mimeTypes = [];
			field.thumbs = [];
		}
		weddings.removeIndex('idx_weddings_owner');
		weddings.fields.removeByName('owner');
		app.save(weddings);
	}
);
