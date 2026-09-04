function base64Encode(value) {
	var alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	var output = '';

	for (var index = 0; index < value.length; index += 3) {
		var first = value.charCodeAt(index);
		var second = value.charCodeAt(index + 1);
		var third = value.charCodeAt(index + 2);
		var firstIndex = first >> 2;
		var secondIndex = ((first & 3) << 4) | (second >> 4);
		var thirdIndex = ((second & 15) << 2) | (third >> 6);
		var fourthIndex = third & 63;

		if (isNaN(second)) {
			thirdIndex = 64;
			fourthIndex = 64;
		} else if (isNaN(third)) {
			fourthIndex = 64;
		}

		output +=
			alphabet.charAt(firstIndex) +
			alphabet.charAt(secondIndex) +
			alphabet.charAt(thirdIndex) +
			alphabet.charAt(fourthIndex);
	}

	return output;
}

function getConfig() {
	var price = Math.floor(Number($os.getenv('WEDEZ_PRO_PRICE')) || 50000);
	var appUrl = String($os.getenv('WEDEZ_APP_URL') || 'https://wedding.onlytest.my.id').replace(
		/\/+$/,
		''
	);
	var apiUrl = String($os.getenv('WEDEZ_API_URL') || 'https://api-wedding.onlytest.my.id').replace(
		/\/+$/,
		''
	);

	if (price < 1000) {
		throw new ApiError(503, 'Harga paket Pro belum dikonfigurasi dengan benar.');
	}

	if (appUrl.indexOf('https://') !== 0) {
		throw new ApiError(503, 'URL aplikasi pembayaran harus menggunakan HTTPS.');
	}

	if (apiUrl.indexOf('https://') !== 0) {
		throw new ApiError(503, 'URL API pembayaran harus menggunakan HTTPS.');
	}

	return {
		apiUrl: apiUrl,
		appUrl: appUrl,
		price: price,
		secretKey: String($os.getenv('XENDIT_SECRET_KEY') || '').trim(),
		webhookToken: String($os.getenv('XENDIT_WEBHOOK_TOKEN') || '').trim()
	};
}

function getReturnOrigin(requestedOrigin, configuredOrigin) {
	var origin = String(requestedOrigin || '').replace(/\/+$/, '');

	if (origin === configuredOrigin) {
		return origin;
	}

	if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
		return origin;
	}

	return configuredOrigin;
}

function xenditRequest(app, method, path, body) {
	var config = getConfig();

	if (!config.secretKey) {
		throw new ApiError(503, 'Secret API key Xendit belum dikonfigurasi.');
	}

	var request = {
		url: 'https://api.xendit.co' + path,
		method: method,
		timeout: 20,
		headers: {
			Accept: 'application/json',
			Authorization: 'Basic ' + base64Encode(config.secretKey + ':')
		}
	};

	if (body) {
		request.body = JSON.stringify(body);
		request.headers['Content-Type'] = 'application/json';
	}

	var response;

	try {
		response = $http.send(request);
	} catch (error) {
		app.logger().error('Xendit request failed', 'path', path, 'error', error);
		throw new ApiError(502, 'Tidak dapat terhubung ke layanan pembayaran.');
	}

	if (response.statusCode < 200 || response.statusCode >= 300) {
		var errorCode =
			response.json && response.json.error_code ? String(response.json.error_code) : '';
		app
			.logger()
			.error(
				'Xendit rejected request',
				'path',
				path,
				'status',
				response.statusCode,
				'code',
				errorCode
			);

		if (errorCode === 'REQUEST_FORBIDDEN_ERROR' || errorCode === 'INVALID_API_KEY') {
			throw new ApiError(502, 'API key Xendit belum memiliki izin Money-in Write.');
		}

		throw new ApiError(502, 'Xendit tidak dapat memproses pembayaran saat ini.');
	}

	return response.json || {};
}

function getWeddingForAuth(event) {
	var weddingId = String(event.auth.get('wedding_id') || '');

	if (!event.auth.getBool('verified')) {
		throw new ForbiddenError('Verifikasi email terlebih dahulu.');
	}

	if (!weddingId) {
		throw new NotFoundError('Wedding untuk akun ini tidak ditemukan.');
	}

	return event.app.findRecordById('weddings', weddingId);
}

function paymentStatusFromSession(session) {
	var status = String(session.status || '').toUpperCase();

	if (status === 'COMPLETED') {
		return 'paid';
	}

	if (status === 'EXPIRED') {
		return 'expired';
	}

	if (status === 'CANCELED' || status === 'CANCELLED') {
		return 'failed';
	}

	return 'pending';
}

function syncPaymentFromSession(app, payment, session) {
	var sessionId = String(session.payment_session_id || '');
	var expectedSessionId = String(payment.get('provider_transaction_id') || '');
	var expectedAmount = Number(payment.get('amount'));
	var receivedAmount = Number(session.amount);
	var receivedCurrency = String(session.currency || '');

	if (
		!sessionId ||
		sessionId !== expectedSessionId ||
		receivedAmount !== expectedAmount ||
		receivedCurrency !== String(payment.get('currency') || '')
	) {
		throw new BadRequestError('Data pembayaran Xendit tidak sesuai.');
	}

	var status = paymentStatusFromSession(session);
	var currentStatus = String(payment.get('status') || '');

	if (status === currentStatus && status !== 'paid') {
		return status;
	}

	var paymentId = payment.id;
	var weddingId = String(payment.get('wedding') || '');

	app.runInTransaction(function (txApp) {
		var currentPayment = txApp.findRecordById('payments', paymentId);
		var currentWedding = txApp.findRecordById('weddings', weddingId);

		if (status !== currentStatus) {
			currentPayment.set('status', status);
		}

		if (status === 'paid' && !String(currentPayment.get('paid_at') || '')) {
			currentPayment.set('paid_at', new Date().toISOString());
		}

		if (status !== currentStatus || (status === 'paid' && !String(payment.get('paid_at') || ''))) {
			txApp.save(currentPayment);
		}

		if (status === 'paid' && String(currentWedding.get('plan_tier') || '') !== 'pro') {
			currentWedding.set('plan_tier', 'pro');
			txApp.save(currentWedding);
		}
	});

	return status;
}

function paymentResponse(app, weddingId, payment, session) {
	var wedding = app.findRecordById('weddings', weddingId);
	var status = payment ? String(payment.get('status') || 'pending') : 'idle';

	if (String(wedding.get('plan_tier') || '') === 'pro') {
		status = 'paid';
	}

	return {
		plan_tier: String(wedding.get('plan_tier') || 'free'),
		payment: payment
			? {
					id: payment.id,
					status: status,
					amount: Number(payment.get('amount')),
					currency: String(payment.get('currency') || 'IDR'),
					expires_at: String(payment.get('expires_at') || ''),
					checkout_url: session ? String(session.payment_link_url || '') : ''
				}
			: {
					id: '',
					status: status,
					amount: getConfig().price,
					currency: 'IDR',
					expires_at: '',
					checkout_url: ''
				}
	};
}

module.exports = {
	getConfig: getConfig,
	getReturnOrigin: getReturnOrigin,
	getWeddingForAuth: getWeddingForAuth,
	paymentResponse: paymentResponse,
	syncPaymentFromSession: syncPaymentFromSession,
	xenditRequest: xenditRequest
};
