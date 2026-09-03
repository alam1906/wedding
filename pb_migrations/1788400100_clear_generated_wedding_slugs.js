/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	app.db().newQuery("UPDATE weddings SET slug = '' WHERE slug = id").execute();
});
