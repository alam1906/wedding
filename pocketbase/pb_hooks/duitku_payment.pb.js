/* eslint-disable @typescript-eslint/no-require-imports */

routerAdd(
	'POST',
	'/api/wedez/payments/quote',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/duitku_helpers.js');
		helpers.getWeddingForAuth(e);
		var affiliate = require(__hooks + '/affiliate_helpers.js');
		var body = new DynamicModel({ couponCode: '' });
		e.bindBody(body);
		var quote = affiliate.quote(e.app, e.auth.id, helpers.getConfig().price, body.couponCode);
		// The buyer receives pricing only, never the affiliate's private profile.
		return e.json(200, {
			original_amount: quote.original_amount,
			amount: quote.amount,
			discount_amount: quote.discount_amount,
			discount_percent: quote.discount_percent,
			coupon_code: quote.coupon_code
		});
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

routerAdd(
	'POST',
	'/api/wedez/payments/methods',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/duitku_helpers.js');
		helpers.getWeddingForAuth(e);
		var config = helpers.getConfig();
		var body = new DynamicModel({ couponCode: '' });
		e.bindBody(body);
		var affiliate = require(__hooks + '/affiliate_helpers.js');
		var quote = affiliate.quote(e.app, e.auth.id, config.price, body.couponCode);
		return e.json(200, {
			environment: config.environment,
			quote: {
				original_amount: quote.original_amount,
				amount: quote.amount,
				discount_amount: quote.discount_amount,
				discount_percent: quote.discount_percent,
				coupon_code: quote.coupon_code
			},
			methods: helpers.getPaymentMethods(e.app, config, quote.amount)
		});
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

routerAdd(
	'POST',
	'/api/wedez/payments/session',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/duitku_helpers.js');
		var config = helpers.getConfig();
		var wedding = helpers.getWeddingForAuth(e);
		var weddingId = wedding.id;

		if (String(wedding.get('plan_tier') || '') === 'pro') {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null));
		}

		var body = new DynamicModel({
			couponCode: '',
			paymentMethod: '',
			expectedAmount: -1,
			expectedFee: -1
		});
		e.bindBody(body);
		var affiliate = require(__hooks + '/affiliate_helpers.js');
		if (!helpers.paymentKind(body.paymentMethod))
			throw new BadRequestError('Pilih metode QRIS atau virtual account yang tersedia.');
		// A local deadline alone is not proof of non-payment. Reconcile expired
		// reservations outside the DB transaction before allowing another invoice.
		var previous = e.app.findRecordsByFilter(
			'payments',
			"wedding = {:wedding} && provider = 'duitku' && (status = 'pending' || status = 'expired')",
			'-created',
			0,
			0,
			{ wedding: weddingId }
		);
		for (var p = 0; p < previous.length; p++) {
			if (helpers.paymentHasExpired(previous[p]) || previous[p].getString('status') === 'expired') {
				var reconciled = helpers.reconcilePayment(e.app, config, previous[p]);
				if (reconciled.getString('status') === 'paid')
					return e.json(200, helpers.paymentResponse(e.app, weddingId, reconciled));
			}
		}
		var quoted = affiliate.quote(e.app, e.auth.id, config.price, body.couponCode);
		var method = helpers.getPaymentMethods(e.app, config, quoted.amount).find(function (item) {
			return item.code === body.paymentMethod;
		});
		if (!method) throw new BadRequestError('Metode pembayaran tidak tersedia. Pilih metode lain.');
		if (
			(body.expectedAmount >= 0 && body.expectedAmount !== quoted.amount) ||
			(body.expectedFee >= 0 && body.expectedFee !== method.fee)
		)
			throw new ApiError(
				409,
				'Harga atau biaya layanan berubah. Muat ulang metode pembayaran sebelum melanjutkan.'
			);
		var payment;
		var reused = false;
		var alreadyPro = false;
		e.app.runInTransaction(function (txApp) {
			if (txApp.findRecordById('weddings', weddingId).getString('plan_tier') === 'pro') {
				alreadyPro = true;
				return;
			}
			var pricing = affiliate.quote(txApp, e.auth.id, config.price, body.couponCode);
			if (pricing.amount !== quoted.amount || pricing.coupon_code !== quoted.coupon_code)
				throw new ApiError(409, 'Harga berubah. Muat ulang halaman sebelum melanjutkan.');
			var pendingPayments = txApp.findRecordsByFilter(
				'payments',
				"wedding = {:wedding} && provider = 'duitku' && (status = 'pending' || status = 'expired')",
				'-created',
				0,
				0,
				{ wedding: weddingId }
			);
			for (var index = 0; index < pendingPayments.length; index++) {
				var pending = pendingPayments[index];
				if (helpers.paymentHasExpired(pending) || pending.getString('status') === 'expired') {
					throw new ApiError(
						409,
						'Status akhir tagihan sebelumnya belum dikonfirmasi. Periksa status atau hubungi bantuan sebelum membuat pembayaran baru.'
					);
				}
				if (
					pending.getInt('amount') !== pricing.amount ||
					pending.getString('coupon_code') !== pricing.coupon_code ||
					pending.getString('payment_method') !== method.code
				) {
					throw new ApiError(
						409,
						'Masih ada pembayaran aktif dengan harga, kupon, atau metode berbeda. Selesaikan atau periksa status pembayaran tersebut.'
					);
				}
				if (!pending.getString('va_number') && !pending.getString('qr_string'))
					throw new ApiError(
						409,
						'Pembayaran sedang disiapkan. Muat ulang untuk memeriksa status; jangan membuat pembayaran lain.'
					);
				payment = pending;
				reused = true;
				return;
			}
			payment = new Record(txApp.findCollectionByNameOrId('payments'));
			payment.set('wedding', weddingId);
			payment.set('provider', 'duitku');
			payment.set(
				'provider_transaction_id',
				'WZ' +
					Date.now().toString(36).toUpperCase() +
					$security.randomStringWithAlphabet(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789')
			);
			payment.set('currency', 'IDR');
			payment.set('status', 'pending');
			payment.set('checkout_lock', weddingId);
			payment.set('payment_method', method.code);
			payment.set('payment_method_name', method.name);
			payment.set('payment_kind', method.kind);
			payment.set('payment_fee', method.fee);
			payment.set(
				'expires_at',
				new Date(Date.now() + config.expiryMinutes * 60 * 1000).toISOString()
			);
			Object.keys(pricing).forEach(function (key) {
				payment.set(key, pricing[key]);
			});
			txApp.save(payment);
		});
		if (alreadyPro) return e.json(200, helpers.paymentResponse(e.app, weddingId, null));
		if (reused) return e.json(200, helpers.paymentResponse(e.app, weddingId, payment));
		var merchantOrderId = payment.getString('provider_transaction_id');

		var email = String(e.auth.get('email') || '').trim();
		var customerName = String(e.auth.get('name') || '').trim() || email || 'Pengguna Wedez';
		// A timeout may still create an invoice. Keep the reservation until
		// a final gateway status rather than issuing another charge.
		var invoice = helpers.createInvoice(e.app, config, {
			paymentAmount: payment.getInt('amount'),
			merchantOrderId: merchantOrderId,
			productDetails: 'Upgrade Wedez Pro',
			additionalParam: weddingId,
			merchantUserInfo: email,
			paymentMethod: method.code,
			customerVaName: customerName.slice(0, 20),
			email: email,
			itemDetails: [
				{
					name: 'Paket Wedez Pro',
					price: payment.getInt('amount'),
					quantity: 1
				}
			],
			customerDetail: {
				firstName: customerName,
				lastName: '',
				email: email,
				merchantCustomerId: e.auth.id
			},
			callbackUrl: config.callbackUrl,
			returnUrl: config.returnUrl,
			expiryPeriod: config.expiryMinutes
		});

		var statusCode = String(invoice.statusCode || '');
		var checkoutUrl = String(invoice.paymentUrl || '');
		var reference = String(invoice.reference || '');
		var vaNumber = String(invoice.vaNumber || '').trim();
		var qrString = String(invoice.qrString || '').trim();
		var responseMerchantCode = String(invoice.merchantCode || config.merchantCode);

		if (
			statusCode !== '00' ||
			!reference ||
			responseMerchantCode !== config.merchantCode ||
			Number(invoice.amount) !== payment.getInt('amount') ||
			(method.kind === 'va' && !/^\d{5,40}$/.test(vaNumber)) ||
			(method.kind === 'qris' && (!qrString || qrString.length > 4096))
		) {
			// A malformed response is not proof that the gateway has no invoice.
			throw new ApiError(
				502,
				'Detail pembayaran belum tersedia. Periksa status tagihan sebelum mencoba lagi.'
			);
		}

		e.app.runInTransaction(function (txApp) {
			payment = txApp.findRecordById('payments', payment.id);
			payment.set('provider_reference', reference);
			payment.set('checkout_url', checkoutUrl);
			payment.set('va_number', method.kind === 'va' ? vaNumber : '');
			payment.set('qr_string', method.kind === 'qris' ? qrString : '');
			txApp.save(payment);
		});

		return e.json(201, helpers.paymentResponse(e.app, weddingId, payment));
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

routerAdd(
	'GET',
	'/api/wedez/payments/status',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/duitku_helpers.js');
		var config = helpers.getConfig();
		var wedding = helpers.getWeddingForAuth(e);
		var weddingId = wedding.id;

		var payments = e.app.findRecordsByFilter(
			'payments',
			"wedding = {:wedding} && provider = 'duitku'" +
				(wedding.getString('plan_tier') === 'pro' ? " && status = 'paid'" : ''),
			'-created',
			1,
			0,
			{ wedding: weddingId }
		);

		if (!payments.length) {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null));
		}

		var unresolved =
			wedding.getString('plan_tier') === 'pro'
				? []
				: e.app.findRecordsByFilter(
						'payments',
						"wedding = {:wedding} && provider = 'duitku' && (status = 'pending' || status = 'expired')",
						'-created',
						0,
						0,
						{ wedding: weddingId }
					);
		// A newer failed invoice must not hide an older unresolved reservation,
		// including during DB-only polling.
		var payment = unresolved.length ? unresolved[0] : payments[0];

		if (e.requestInfo().query.refresh !== 'false') {
			// Include legacy locally-expired invoices, even if a newer invoice
			// was created by an older release. A late success must not be lost.
			var pendingPayment = null;
			for (var i = 0; i < unresolved.length; i++) {
				var reconciled = helpers.reconcilePayment(e.app, config, unresolved[i]);
				if (
					!pendingPayment &&
					(reconciled.getString('status') === 'pending' ||
						reconciled.getString('status') === 'expired')
				)
					pendingPayment = reconciled;
				if (reconciled.id === payment.id || reconciled.getString('status') === 'paid')
					payment = reconciled;
				if (reconciled.getString('status') === 'paid') break;
			}
			if (payment.getString('status') !== 'paid' && pendingPayment) payment = pendingPayment;
		}

		return e.json(200, helpers.paymentResponse(e.app, weddingId, payment));
	},
	$apis.requireAuth('users')
);

routerAdd(
	'POST',
	'/api/wedez/payments/duitku/callback',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		e.response.header().set('X-Content-Type-Options', 'nosniff');
		var helpers = require(__hooks + '/duitku_helpers.js');
		var config = helpers.getConfig();
		var payload = new DynamicModel({
			merchantCode: '',
			amount: '',
			merchantOrderId: '',
			resultCode: '',
			reference: '',
			signature: ''
		});
		e.bindBody(payload);

		var merchantCode = String(payload.merchantCode || '').trim();
		var rawAmount = String(payload.amount || '').trim();
		var merchantOrderId = String(payload.merchantOrderId || '').trim();
		var resultCode = String(payload.resultCode || '').trim();
		var reference = String(payload.reference || '').trim();
		var signature = String(payload.signature || '')
			.trim()
			.toLowerCase();

		if (!merchantCode || !rawAmount || !merchantOrderId || !signature) {
			throw new BadRequestError('Callback Duitku tidak lengkap.');
		}

		if (merchantCode !== config.merchantCode) {
			throw new UnauthorizedError('Merchant callback Duitku tidak valid.');
		}

		var expectedSignature = $security
			.hs256(merchantCode + rawAmount + merchantOrderId, config.apiKey)
			.toLowerCase();

		if (!$security.equal(signature, expectedSignature)) {
			throw new UnauthorizedError('Signature callback Duitku tidak valid.');
		}

		var payment;

		try {
			payment = e.app.findFirstRecordByFilter(
				'payments',
				"provider = 'duitku' && provider_transaction_id = {:merchantOrderId}",
				{ merchantOrderId: merchantOrderId }
			);
		} catch {
			throw new NotFoundError('Transaksi pembayaran tidak ditemukan.');
		}

		if (Number(rawAmount) !== Number(payment.get('amount'))) {
			throw new BadRequestError('Nominal callback Duitku tidak sesuai.');
		}
		if (
			payment.getString('provider_reference') &&
			payment.getString('provider_reference') !== reference
		)
			throw new BadRequestError('Referensi callback Duitku tidak sesuai.');

		if (resultCode === '00') {
			helpers.applyPaymentStatus(e.app, payment, 'paid', reference);
		} else if (resultCode === '01') {
			helpers.applyPaymentStatus(e.app, payment, 'failed', reference);
		}

		return e.json(200, { received: true });
	},
	$apis.bodyLimit(16384)
);
