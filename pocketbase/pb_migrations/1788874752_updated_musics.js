/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_3134802153');

		// update field
		collection.fields.addAt(
			2,
			new Field({
				help: '',
				hidden: false,
				id: 'file3444712010',
				maxSelect: 0,
				maxSize: 15000000,
				mimeTypes: [],
				name: 'music',
				presentable: false,
				protected: false,
				required: false,
				system: false,
				thumbs: [],
				type: 'file'
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_3134802153');

		// update field
		collection.fields.addAt(
			2,
			new Field({
				help: '',
				hidden: false,
				id: 'file3444712010',
				maxSelect: 0,
				maxSize: 0,
				mimeTypes: [],
				name: 'music',
				presentable: false,
				protected: false,
				required: false,
				system: false,
				thumbs: [],
				type: 'file'
			})
		);

		return app.save(collection);
	}
);
