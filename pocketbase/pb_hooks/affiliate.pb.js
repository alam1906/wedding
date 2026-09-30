/* eslint-disable @typescript-eslint/no-require-imports */

routerAdd(
	'GET',
	'/api/wedez/affiliate/me',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/affiliate_helpers.js');
		helpers.requireVerified(e);
		return e.json(200, helpers.summary(e.app, helpers.findAffiliate(e.app, e.auth.id)));
	},
	$apis.requireAuth('users')
);

routerAdd(
	'POST',
	'/api/wedez/affiliate/enroll',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/affiliate_helpers.js');
		helpers.requireVerified(e);
		return e.json(200, helpers.enroll(e.app, e.auth.id));
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

routerAdd(
	'PATCH',
	'/api/wedez/affiliate/bank',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/affiliate_helpers.js');
		var affiliate = helpers.requireAffiliate(e, false);
		var data = new DynamicModel({ bank_name: '', account_number: '', account_name: '' });
		e.bindBody(data);
		var bank = helpers.bankDetails(data);
		// Re-read inside the transaction so a simultaneous admin status update is preserved.
		e.app.runInTransaction(function (txApp) {
			affiliate = txApp.findRecordById('affiliates', affiliate.id);
			Object.keys(bank).forEach(function (key) {
				affiliate.set(key, bank[key]);
			});
			txApp.save(affiliate);
		});
		return e.json(200, affiliate);
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(2048)
);

routerAdd(
	'POST',
	'/api/wedez/affiliate/payouts',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/affiliate_helpers.js');
		var affiliate = helpers.requireAffiliate(e, true);
		return e.json(200, helpers.requestPayout(e.app, affiliate.id));
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

// The existing PocketBase Admin is the operator interface. Financial transitions
// from it must use the same transaction as their associated commission updates.
onRecordUpdateRequest(function (e) {
	if (!e.hasSuperuserAuth()) throw new ForbiddenError('Hanya admin dapat memproses pencairan.');
	// A single-file field normalizes multiple uploads to the last file before this hook.
	// Check the multipart request too so extra images cannot be silently discarded.
	function uploadCount(key) {
		try {
			return e.findUploadedFiles(key).length;
		} catch (error) {
			// Unlike getUnsavedFiles, findUploadedFiles throws for an absent form key.
			if (String(error).indexOf('http: no such file') >= 0) return 0;
			throw error;
		}
	}
	if (
		String(e.requestInfo().headers.content_type || '').indexOf('multipart/form-data') === 0 &&
		uploadCount('transfer_proof') + uploadCount('transfer_proof+') > 1
	) {
		throw new BadRequestError('Unggah satu gambar bukti transfer saja.');
	}
	var original = e.record.original();
	[
		'affiliate',
		'commissions',
		'amount',
		'bank_name',
		'account_number',
		'account_name',
		'paid_at'
	].forEach(function (key) {
		if (JSON.stringify(e.record.get(key)) !== JSON.stringify(original.get(key)))
			throw new BadRequestError('Data pengajuan pencairan tidak dapat diubah.');
	});
	var helpers = require(__hooks + '/affiliate_helpers.js');
	// publicExport contains file names, not the uploaded file objects needed for storage.
	var payout = helpers.updatePayout(
		e.app,
		e.record.id,
		e.record.publicExport(),
		e.record.getUnsavedFiles('transfer_proof')
	);
	return e.json(200, payout);
}, 'affiliate_payouts');

onRecordUpdateRequest(function (e) {
	if (!e.hasSuperuserAuth()) throw new ForbiddenError('Hanya admin dapat mengubah keanggotaan.');
	var original = e.record.original();
	if (
		e.record.getString('user') !== original.getString('user') ||
		e.record.getString('code') !== original.getString('code')
	) {
		throw new BadRequestError('Pemilik dan kode affiliate tidak dapat diubah.');
	}
	if (
		e.record.getString('status') === 'active' &&
		(!e.record.getString('user') ||
			!e.app.findRecordById('users', e.record.getString('user')).getBool('verified'))
	) {
		throw new BadRequestError('Email affiliate belum terverifikasi.');
	}
	e.next();
}, 'affiliates');

onRecordUpdateRequest(function (e) {
	if (!e.hasSuperuserAuth()) throw new ForbiddenError('Hanya admin dapat membatalkan komisi.');
	var requested = e.record.publicExport();
	var result;
	e.app.runInTransaction(function (txApp) {
		result = txApp.findRecordById('affiliate_commissions', e.record.id);
		if (
			requested.affiliate !== result.getString('affiliate') ||
			requested.payment !== result.getString('payment') ||
			requested.amount !== result.getInt('amount')
		)
			throw new BadRequestError('Detail komisi tidak dapat diubah.');
		if (
			result.getString('status') !== 'available' ||
			requested.status !== 'void' ||
			!String(requested.void_reason || '').trim()
		) {
			throw new BadRequestError(
				'Hanya komisi tersedia yang dapat dibatalkan, dengan alasan. Komisi yang sudah dibayar memerlukan rekonsiliasi terpisah.'
			);
		}
		result.set('status', 'void');
		result.set('void_reason', String(requested.void_reason).trim());
		txApp.save(result);
	});
	return e.json(200, result);
}, 'affiliate_commissions');

onRecordCreateRequest(
	function () {
		throw new BadRequestError('Gunakan alur aplikasi untuk membuat catatan affiliate.');
	},
	'affiliates',
	'affiliate_commissions',
	'affiliate_payouts'
);

onRecordDelete(
	function () {
		throw new BadRequestError('Riwayat affiliate dan pembayaran tidak dapat dihapus.');
	},
	'affiliates',
	'affiliate_commissions',
	'affiliate_payouts',
	'payments'
);

onRecordCreateRequest(function (e) {
	if (!e.hasSuperuserAuth()) {
		e.record.set('verified', false);
		e.record.set('wedding_id', '');
		e.record.set('home_area', '');
	}
	e.next();
}, 'users');
