/* eslint-disable @typescript-eslint/no-require-imports */

routerAdd(
	'POST',
	'/api/wedez/payments/session',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/xendit_helpers.js');
		var config = helpers.getConfig();
		var request = new DynamicModel({ return_origin: '' });
		e.bindBody(request);
		var wedding = helpers.getWeddingForAuth(e);
		var weddingId = wedding.id;
		var returnOrigin = helpers.getReturnOrigin(request.return_origin, config.appUrl);
		var encodedReturnOrigin = encodeURIComponent(returnOrigin);
		var returnEndpoint = config.apiUrl + '/api/wedez/payments/return';
		var successReturnUrl = returnEndpoint + '?result=success&origin=' + encodedReturnOrigin;
		var cancelReturnUrl = returnEndpoint + '?result=cancel&origin=' + encodedReturnOrigin;

		if (String(wedding.get('plan_tier') || '') === 'pro') {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null, null));
		}

		var pendingPayments = e.app.findRecordsByFilter(
			'payments',
			"wedding = {:wedding} && provider = 'xendit' && (status = 'pending' || status = 'paid')",
			'id',
			50,
			0,
			{ wedding: weddingId }
		);

		for (var index = 0; index < pendingPayments.length; index++) {
			var pendingPayment = pendingPayments[index];
			var existingSession = helpers.xenditRequest(
				e.app,
				'GET',
				'/sessions/' + encodeURIComponent(String(pendingPayment.get('provider_transaction_id'))),
				null
			);
			var existingStatus = helpers.syncPaymentFromSession(e.app, pendingPayment, existingSession);

			if (existingStatus === 'pending') {
				if (
					Number(pendingPayment.get('amount')) === config.price &&
					String(existingSession.success_return_url || '') === successReturnUrl &&
					String(existingSession.cancel_return_url || '') === cancelReturnUrl
				) {
					return e.json(
						200,
						helpers.paymentResponse(e.app, weddingId, pendingPayment, existingSession)
					);
				}

				var canceledSession = helpers.xenditRequest(
					e.app,
					'POST',
					'/sessions/' +
						encodeURIComponent(String(pendingPayment.get('provider_transaction_id'))) +
						'/cancel',
					null
				);
				helpers.syncPaymentFromSession(e.app, pendingPayment, canceledSession);
			}

			if (existingStatus === 'paid') {
				return e.json(200, helpers.paymentResponse(e.app, weddingId, pendingPayment, null));
			}
		}

		var referenceId = 'wedez_pro_' + weddingId + '_' + $security.randomString(12);
		var session = helpers.xenditRequest(e.app, 'POST', '/sessions', {
			reference_id: referenceId,
			session_type: 'PAY',
			mode: 'PAYMENT_LINK',
			amount: config.price,
			currency: 'IDR',
			country: 'ID',
			capture_method: 'AUTOMATIC',
			locale: 'id',
			description: 'Upgrade Wedez Pro',
			allowed_payment_channels: ['QRIS'],
			metadata: { wedding_id: weddingId },
			success_return_url: successReturnUrl,
			cancel_return_url: cancelReturnUrl
		});
		var sessionId = String(session.payment_session_id || '');
		var checkoutUrl = String(session.payment_link_url || '');

		if (!sessionId || !checkoutUrl) {
			throw new ApiError(502, 'Xendit tidak mengembalikan tautan pembayaran.');
		}

		var payment = new Record(e.app.findCollectionByNameOrId('payments'));
		payment.set('wedding', weddingId);
		payment.set('provider', 'xendit');
		payment.set('provider_transaction_id', sessionId);
		payment.set('amount', config.price);
		payment.set('currency', 'IDR');
		payment.set('status', 'pending');

		if (session.expires_at) {
			payment.set('expires_at', String(session.expires_at));
		}

		e.app.save(payment);

		return e.json(201, helpers.paymentResponse(e.app, weddingId, payment, session));
	},
	$apis.requireAuth('users'),
	$apis.bodyLimit(1024)
);

routerAdd('GET', '/api/wedez/payments/return', function (e) {
	var helpers = require(__hooks + '/xendit_helpers.js');
	var config = helpers.getConfig();
	var result = String(e.request.url.query().get('result') || 'cancel');
	var requestedOrigin = String(e.request.url.query().get('origin') || '');
	var returnOrigin = helpers.getReturnOrigin(requestedOrigin, config.appUrl);
	var paymentResult = result === 'success' ? 'success' : 'cancel';

	return e.redirect(303, returnOrigin + '/user/setting?payment=' + paymentResult);
});

routerAdd(
	'GET',
	'/api/wedez/payments/status',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/xendit_helpers.js');
		var wedding = helpers.getWeddingForAuth(e);
		var weddingId = wedding.id;

		if (String(wedding.get('plan_tier') || '') === 'pro') {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null, null));
		}

		var payments = e.app.findRecordsByFilter(
			'payments',
			"wedding = {:wedding} && provider = 'xendit' && (status = 'pending' || status = 'paid')",
			'id',
			50,
			0,
			{ wedding: weddingId }
		);

		if (!payments.length) {
			return e.json(200, helpers.paymentResponse(e.app, weddingId, null, null));
		}

		var lastPayment = null;
		var lastSession = null;

		for (var index = 0; index < payments.length; index++) {
			var payment = payments[index];
			var session = helpers.xenditRequest(
				e.app,
				'GET',
				'/sessions/' + encodeURIComponent(String(payment.get('provider_transaction_id'))),
				null
			);
			var status = helpers.syncPaymentFromSession(e.app, payment, session);
			payment = e.app.findRecordById('payments', payment.id);
			lastPayment = payment;
			lastSession = session;

			if (status === 'paid') {
				return e.json(200, helpers.paymentResponse(e.app, weddingId, payment, session));
			}
		}

		return e.json(200, helpers.paymentResponse(e.app, weddingId, lastPayment, lastSession));
	},
	$apis.requireAuth('users')
);

routerAdd(
	'POST',
	'/api/wedez/payments/xendit-webhook',
	function (e) {
		e.response.header().set('Cache-Control', 'no-store');
		var helpers = require(__hooks + '/xendit_helpers.js');
		var config = helpers.getConfig();

		if (!config.webhookToken) {
			throw new ApiError(503, 'Webhook Xendit belum dikonfigurasi.');
		}

		var callbackToken = String(e.request.header.get('x-callback-token') || '');

		if (!callbackToken || !$security.equal(callbackToken, config.webhookToken)) {
			throw new UnauthorizedError('Webhook Xendit tidak valid.');
		}

		var payload = new DynamicModel({ event: '', data: {} });
		e.bindBody(payload);
		var eventName = String(payload.event || '');

		if (eventName !== 'payment_session.completed' && eventName !== 'payment_session.expired') {
			return e.json(200, { received: true });
		}

		var session = payload.data || {};
		var sessionId = String(session.payment_session_id || '');

		if (!sessionId) {
			throw new BadRequestError('Payment Session ID tidak ditemukan.');
		}

		var payment;

		try {
			payment = e.app.findFirstRecordByFilter(
				'payments',
				"provider = 'xendit' && provider_transaction_id = {:sessionId}",
				{ sessionId: sessionId }
			);
		} catch {
			throw new NotFoundError('Transaksi pembayaran tidak ditemukan.');
		}

		helpers.syncPaymentFromSession(e.app, payment, session);

		return e.json(200, { received: true });
	},
	$apis.bodyLimit(32768)
);
