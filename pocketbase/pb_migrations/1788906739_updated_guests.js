/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2047001084');

		// add field
		collection.fields.addAt(
			8,
			new Field({
				hidden: false,
				id: 'autodate2341372968',
				name: 'created_at',
				onCreate: true,
				onUpdate: false,
				presentable: false,
				system: false,
				type: 'autodate'
			})
		);

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_2047001084');

		// remove field
		collection.fields.removeById('autodate2341372968');

		return app.save(collection);
	}
);
