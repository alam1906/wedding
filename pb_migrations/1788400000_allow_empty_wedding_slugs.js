/// <reference path="../pb_data/types.d.ts" />
migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1115120447');

		collection.addIndex('idx_4in7ijlqe6', true, 'slug', "slug != ''");

		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('pbc_1115120447');

		collection.addIndex('idx_4in7ijlqe6', true, 'slug', '');

		return app.save(collection);
	}
);
