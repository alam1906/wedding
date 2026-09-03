/// <reference path="../pb_data/types.d.ts" />
migrate((app) => {
	const settings = app.settings();

	settings.meta.appURL = 'https://api-wedding.onlytest.my.id';

	return app.save(settings);
});
