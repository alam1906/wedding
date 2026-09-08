/* eslint-disable @typescript-eslint/no-require-imports */

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

		var pendingPayments = e.app.findRecordsByFilter(
			'payments',
			"wedding = {:wedding} && provider = 'duitku' && status = 'pending'",
			'-created',
			10,
			0,
			{ wedding: weddingId }
		);

		for (var index = 0; index < pendingPayments.length; index++) {
			var pendingPayment = pendingPayments[index];

			if (helpers.paymentHasExpired(pendingPayment)) {
				helpers.applyPaymentStatus(e.app, pendingPayment, 'expired', '');
				continue;
			}

			if (
				Number(pendingPayment.get('amount')) === config.price &&
				String(pendingPayment.get('checkout_url') || '')
			) {
				return e.json(200, helpers.paymentResponse(e.app, weddingId, pendingPayment));
			}

			helpers.applyPaymentStatus(e.app, pendingPayment, 'failed', '');
		}

		var merchantOrderId =
			'WZ' +
			Date.now().toString(36).toUpperCase() +
			$security.randomStringWithAlphabet(8, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789');
		var expiresAt = new Date(Date.now() + config.expiryMinutes * 60 * 1000).toISOString();
		var payment = new Record(e.app.findCollectionByNameOrId('payments'));

		payment.set('wedding', weddingId);
		payment.set('provider', 'duitku');
		payment.set('provider_transaction_id', merchantOrderId);
		payment.set('amount', config.price);
		payment.set('currency', 'IDR');
		payment.set('status', 'pending');
		payment.set('expires_at', expiresAt);
		e.app.save(payment);

		var email = String(e.auth.get('email') || '').trim();
		var customerName = String(e.auth.get('name') || '').trim() || email || 'Pengguna Wedez';
		var invoice;

		try {
			invoice = helpers.createInvoice(e.app, config, {
				paymentAmount: config.price,
				merchantOrderId: merchantOrderId,
				productDetails: 'Upgrade Wedez Pro',
				additionalParam: weddingId,
				merchantUserInfo: email,
				paymentMethod: '',
				customerVaName: customerName,
				email: email,
				itemDetails: [
					{
						name: 'Paket Wedez Pro',
						price: config.price,
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
		} catch (error) {
			helpers.applyPaymentStatus(e.app, payment, 'failed', '');
			throw error;
		}

		var statusCode = String(invoice.statusCode || '');
		var checkoutUrl = String(invoice.paymentUrl || '');
		var reference = String(invoice.reference || '');
		var responseMerchantCode = String(invoice.merchantCode || config.merchantCode);

		if (
			statusCode !== '00' ||
			!checkoutUrl ||
			!reference ||
			responseMerchantCode !== config.merchantCode
		) {
			helpers.applyPaymentStatus(e.app, payment, 'failed', reference);
			throw new ApiError(502, 'Duitku tidak mengembalikan tautan pembayaran yang valid.');
		}

		payment = e.app.findRecordById('payments', payment.id);
		payment.set('provider_reference', reference);
		payment.set('checkout_url', checkoutUrl);
		e.app.save(payment);

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

		if (String(wedding.get('plan_tier') || '') === 'pro') {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null));
		}

		var payments = e.app.findRecordsByFilter(
			'payments',
			"wedding = {:wedding} && provider = 'duitku' && (status = 'pending' || status = 'paid')",
			'-created',
			1,
			0,
			{ wedding: weddingId }
		);

		if (!payments.length) {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null));
		}

		var payment = payments[0];

		if (String(payment.get('status') || '') === 'pending') {
			var merchantOrderId = String(payment.get('provider_transaction_id') || '');
			var transaction = helpers.checkTransaction(e.app, config, merchantOrderId);
			var status = helpers.syncPaymentFromStatus(e.app, payment, transaction);

			payment = e.app.findRecordById('payments', payment.id);
			if (status === 'pending' && helpers.paymentHasExpired(payment)) {
				helpers.applyPaymentStatus(e.app, payment, 'expired', '');
				payment = e.app.findRecordById('payments', payment.id);
			}
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

		if (resultCode === '00') {
			helpers.applyPaymentStatus(e.app, payment, 'paid', reference);
		} else if (resultCode === '01') {
			helpers.applyPaymentStatus(e.app, payment, 'failed', reference);
		}

		return e.json(200, { received: true });
	},
	$apis.bodyLimit(16384)
);
