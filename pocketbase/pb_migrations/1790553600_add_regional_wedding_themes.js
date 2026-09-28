/// <reference path="../pb_data/types.d.ts" />

const regionalThemes = [
	'pinto-aceh',
	'kawung-jawa',
	'gorga-batak',
	'lipa-sabbe-bugis',
	'gigi-balang-betawi',
	'gonjong-minang',
	'tongkonan-toraja'
];

migrate(
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		theme.values = [
			...theme.values,
			...regionalThemes.filter((value) => !theme.values.includes(value))
		];
		return app.save(collection);
	},
	(app) => {
		const collection = app.findCollectionByNameOrId('weddings');
		const theme = collection.fields.getByName('theme');
		theme.values = theme.values.filter((value) => !regionalThemes.includes(value));
		return app.save(collection);
	}
);
