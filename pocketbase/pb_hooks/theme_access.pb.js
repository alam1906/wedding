/* eslint-disable @typescript-eslint/no-require-imports */

onRecordValidate(function (e) {
	require(__hooks + '/theme_access.js').enforceThemeAccess(e.record);
	e.next();
}, 'weddings');
