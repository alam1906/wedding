/* eslint-disable @typescript-eslint/no-require-imports */

onRecordCreateExecute(function (e) {
	require(__hooks + '/guest_limits.js').enforceGuestQuota(e);
}, 'guests');

onRecordUpdateExecute(function (e) {
	require(__hooks + '/guest_limits.js').enforceGuestQuota(e);
}, 'guests');

routerAdd(
	'GET',
	'/api/wedez/guests/quota',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var read = require(__hooks + '/wedding_read_helpers.js');
		var limits = require(__hooks + '/guest_limits.js');
		return e.json(200, limits.guestQuota(e.app, read.ownedWedding(e)));
	},
	$apis.requireAuth('users')
);
