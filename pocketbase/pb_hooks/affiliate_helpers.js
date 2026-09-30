var MINIMUM_PAYOUT = 50000;

function requireVerified(e) {
	if (!e.auth || !e.auth.getBool('verified'))
		throw new ForbiddenError('Verifikasi email terlebih dahulu.');
}

function findAffiliate(app, userId) {
	var records = app.findRecordsByFilter('affiliates', 'user = {:user}', '', 1, 0, { user: userId });
	return records.length ? records[0] : null;
}

function requireAffiliate(e, active) {
	requireVerified(e);
	var affiliate = findAffiliate(e.app, e.auth.id);
	if (!affiliate) throw new NotFoundError('Anda belum terdaftar sebagai affiliate.');
	if (active && affiliate.getString('status') !== 'active')
		throw new ForbiddenError('Keanggotaan affiliate belum aktif.');
	return affiliate;
}

function enroll(app, userId) {
	var affiliate;
	app.runInTransaction(function (txApp) {
		affiliate = findAffiliate(txApp, userId);
		if (affiliate) return;
		var code;
		do {
			code = $security.randomStringWithAlphabet(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789');
		} while (txApp.countRecords('affiliates', $dbx.hashExp({ code: code })) > 0);
		affiliate = new Record(txApp.findCollectionByNameOrId('affiliates'));
		affiliate.set('user', userId);
		affiliate.set('code', code);
		affiliate.set('status', 'pending');
		txApp.save(affiliate);
	});
	return affiliate;
}

function quote(app, userId, price, rawCode) {
	var code = String(rawCode || '')
		.trim()
		.toUpperCase();
	var affiliate = null;
	if (code) {
		if (!/^[A-Z0-9]{6}$/.test(code))
			throw new BadRequestError('Kode kupon harus terdiri dari 6 huruf atau angka.');
		var records = app.findRecordsByFilter(
			'affiliates',
			"code = {:code} && status = 'active'",
			'',
			1,
			0,
			{ code: code }
		);
		if (!records.length)
			throw new BadRequestError('Kode kupon tidak valid atau sudah tidak aktif.');
		affiliate = records[0];
		if (affiliate.getString('user') === userId)
			throw new BadRequestError('Kode kupon sendiri tidak dapat digunakan.');
		if (!app.findRecordById('users', affiliate.getString('user')).getBool('verified')) {
			throw new BadRequestError('Kode kupon tidak valid atau sudah tidak aktif.');
		}
	}
	var discount = affiliate ? Math.floor((price * 10) / 100) : 0;
	var amount = price - discount;
	return {
		affiliate: affiliate ? affiliate.id : '',
		coupon_code: code,
		original_amount: price,
		discount_percent: affiliate ? 10 : 0,
		discount_amount: discount,
		amount: amount,
		commission_basis: affiliate ? 'after_discount' : '',
		commission_percent: affiliate ? 20 : 0,
		commission_amount: affiliate ? Math.floor((amount * 20) / 100) : 0
	};
}

function creditCommission(app, payment) {
	if (!payment.getString('affiliate') || payment.getInt('commission_amount') <= 0) return;
	if (app.countRecords('affiliate_commissions', $dbx.hashExp({ payment: payment.id })) > 0) return;
	// A lifetime upgrade earns once, even if an older invoice is paid late.
	var earlier = app.findRecordsByFilter(
		'payments',
		(payment.getString('wedding') ? 'wedding' : 'archived_wedding_id') +
			" = {:wedding} && status = 'paid' && id != {:id}",
		'',
		1,
		0,
		{
			wedding: payment.getString('wedding') || payment.getString('archived_wedding_id'),
			id: payment.id
		}
	);
	if (earlier.length) return;
	var commission = new Record(app.findCollectionByNameOrId('affiliate_commissions'));
	commission.set('affiliate', payment.getString('affiliate'));
	commission.set('payment', payment.id);
	commission.set('amount', payment.getInt('commission_amount'));
	commission.set('status', 'available');
	app.save(commission);
}

function summary(app, affiliate) {
	var totals = new DynamicModel({ available: 0, reserved: 0, paid: 0, conversions: 0 });
	if (affiliate)
		app
			.db()
			.newQuery(
				"SELECT COALESCE(SUM(CASE WHEN status = 'available' THEN amount ELSE 0 END), 0) AS available, " +
					"COALESCE(SUM(CASE WHEN status = 'reserved' THEN amount ELSE 0 END), 0) AS reserved, " +
					"COALESCE(SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END), 0) AS paid, " +
					"COALESCE(SUM(CASE WHEN status != 'void' THEN 1 ELSE 0 END), 0) AS conversions " +
					'FROM affiliate_commissions WHERE affiliate = {:affiliate}'
			)
			.bind({ affiliate: affiliate.id })
			.one(totals);
	return {
		affiliate: affiliate,
		totals: totals,
		minimum_payout: MINIMUM_PAYOUT,
		discount_percent: 10,
		commission_percent: 20
	};
}

function bankDetails(data) {
	var bank = {
		bank_name: String(data.bank_name || '').trim(),
		account_number: String(data.account_number || '').trim(),
		account_name: String(data.account_name || '').trim()
	};
	if (
		!bank.bank_name ||
		bank.bank_name.length > 80 ||
		!/^\d{5,40}$/.test(bank.account_number) ||
		!bank.account_name ||
		bank.account_name.length > 120
	) {
		throw new BadRequestError(
			'Lengkapi nama bank, nomor rekening (5–40 angka), dan nama pemilik rekening.'
		);
	}
	return bank;
}

function requestPayout(app, affiliateId) {
	var payout;
	app.runInTransaction(function (txApp) {
		var affiliate = txApp.findRecordById('affiliates', affiliateId);
		if (affiliate.getString('status') !== 'active')
			throw new ForbiddenError('Keanggotaan affiliate belum aktif.');
		var active = txApp.findRecordsByFilter(
			'affiliate_payouts',
			"affiliate = {:id} && (status = 'requested' || status = 'processing')",
			'',
			1,
			0,
			{ id: affiliateId }
		);
		if (active.length) {
			payout = active[0];
			return;
		}
		var bank = bankDetails(affiliate.publicExport());
		var commissions = txApp.findRecordsByFilter(
			'affiliate_commissions',
			"affiliate = {:id} && status = 'available'",
			'created,id',
			10000,
			0,
			{ id: affiliateId }
		);
		var amount = commissions.reduce(function (total, record) {
			return total + record.getInt('amount');
		}, 0);
		if (amount < MINIMUM_PAYOUT)
			throw new BadRequestError('Saldo tersedia minimal Rp50.000 untuk pencairan.');
		payout = new Record(txApp.findCollectionByNameOrId('affiliate_payouts'));
		payout.set('affiliate', affiliateId);
		payout.set('amount', amount);
		payout.set(
			'commissions',
			commissions.map(function (record) {
				return record.id;
			})
		);
		payout.set('status', 'requested');
		Object.keys(bank).forEach(function (key) {
			payout.set(key, bank[key]);
		});
		txApp.save(payout);
		commissions.forEach(function (record) {
			record.set('status', 'reserved');
			txApp.save(record);
		});
	});
	return payout;
}

function updatePayout(app, id, data, proofFiles) {
	var payout;
	proofFiles = proofFiles || [];
	app.runInTransaction(function (txApp) {
		payout = txApp.findRecordById('affiliate_payouts', id);
		var current = payout.getString('status');
		var next = String(data.status || current);
		var allowed = { requested: ['processing', 'rejected'], processing: ['paid', 'failed'] };
		var proofChanged =
			proofFiles.length > 0 ||
			String(data.transfer_proof || '') !== payout.getString('transfer_proof');
		if (next === current) {
			if (proofChanged)
				throw new BadRequestError('Bukti transfer yang tersimpan tidak dapat diubah.');
			return;
		}
		if (!allowed[current] || allowed[current].indexOf(next) < 0)
			throw new BadRequestError('Perubahan status pencairan tidak valid.');
		if (next !== 'paid' && proofChanged)
			throw new BadRequestError('Unggah bukti transfer saat menandai pencairan dibayar.');
		var reference = String(
			data.transfer_reference || payout.getString('transfer_reference')
		).trim();
		var note = String(data.note || '').trim();
		if (next === 'paid' && !reference)
			throw new BadRequestError('Isi referensi transfer sebelum menandai pencairan dibayar.');
		if (next === 'paid' && proofFiles.length !== 1)
			throw new BadRequestError(
				'Unggah satu gambar bukti transfer sebelum menandai pencairan dibayar.'
			);
		if ((next === 'rejected' || next === 'failed') && !note)
			throw new BadRequestError('Isi alasan penolakan atau kegagalan pencairan.');
		var records = payout.getStringSlice('commissions').map(function (commissionId) {
			return txApp.findRecordById('affiliate_commissions', commissionId);
		});
		var total = 0;
		records.forEach(function (record) {
			if (
				record.getString('affiliate') !== payout.getString('affiliate') ||
				record.getString('status') !== 'reserved'
			)
				throw new BadRequestError('Komisi pencairan tidak konsisten.');
			total += record.getInt('amount');
		});
		if (total !== payout.getInt('amount'))
			throw new BadRequestError('Total pencairan tidak sesuai.');
		var paidAt = next === 'paid' ? new Date().toISOString() : '';
		payout.set('status', next);
		payout.set('transfer_reference', reference);
		payout.set('note', note);
		payout.set('paid_at', paidAt);
		if (next === 'paid') payout.set('transfer_proof', proofFiles);
		txApp.save(payout);
		if (next === 'processing') return;
		records.forEach(function (record) {
			record.set('status', next === 'paid' ? 'paid' : 'available');
			record.set('paid_at', paidAt);
			txApp.save(record);
		});
	});
	return payout;
}

module.exports = {
	requireVerified: requireVerified,
	findAffiliate: findAffiliate,
	requireAffiliate: requireAffiliate,
	enroll: enroll,
	quote: quote,
	creditCommission: creditCommission,
	summary: summary,
	bankDetails: bankDetails,
	requestPayout: requestPayout,
	updatePayout: updatePayout
};
