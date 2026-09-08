/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1115120447');

		// add field
		collection.fields.addAt(
			26,
			new Field({
				cascadeDelete: false,
				collectionId: 'pbc_3134802153',
				help: '',
				hidden: false,
				id: 'relation3444712010',
				maxSelect: 0,
				minSelect: 0,
				name: 'music',
				presentable: false,
				required: false,
				system: false,
				type: 'relation'
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1115120447');

		// remove field
		collection.fields.removeById('relation3444712010');

		return app.save(collection);
	}
);
