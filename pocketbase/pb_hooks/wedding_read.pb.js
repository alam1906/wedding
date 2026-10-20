/* eslint-disable @typescript-eslint/no-require-imports */

routerAdd(
	'GET',
	'/api/wedez/weddings/summary',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var read = require(__hooks + '/wedding_read_helpers.js');
		return e.json(200, read.weddingSummary(e.app, read.ownedWedding(e)));
	},
	$apis.requireAuth('users')
);

routerAdd(
	'GET',
	'/api/wedez/dashboard',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var read = require(__hooks + '/wedding_read_helpers.js');
		var wedding = read.ownedWedding(e);
		var summary = read.weddingSummary(e.app, wedding);
		return e.json(200, {
			slug: summary.slug,
			plan_tier: summary.plan_tier,
			completion: summary.completion,
			guests: read.guestStats(e.app, wedding.id)
		});
	},
	$apis.requireAuth('users')
);
