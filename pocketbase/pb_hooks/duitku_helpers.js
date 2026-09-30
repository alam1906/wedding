/* eslint-disable @typescript-eslint/no-require-imports */

function trimTrailingSlash(value) {
	return String(value || '')
		.trim()
		.replace(/\/+$/, '');
}

function validReturnUrl(value, environment) {
	if (/^https:\/\//.test(value)) {
		return true;
	}

	return (
		environment === 'sandbox' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/.test(value)
	);
}

function paymentHasExpired(payment) {
	var expiresAt = Date.parse(String(payment.get('expires_at') || ''));
	return Number.isFinite(expiresAt) && expiresAt <= Date.now();
}

function getConfig() {
	var environment = String($os.getenv('DUITKU_ENV') || 'sandbox')
		.trim()
		.toLowerCase();
	var expectedApiUrl =
		environment === 'production' ? 'https://api-prod.duitku.com' : 'https://api-sandbox.duitku.com';
	var expectedStatusUrl =
		environment === 'production'
			? 'https://passport.duitku.com/webapi/api/merchant/transactionStatus'
			: 'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus';
	var apiUrl = trimTrailingSlash($os.getenv('DUITKU_API_URL') || expectedApiUrl);
	var callbackUrl = String($os.getenv('DUITKU_CALLBACK_URL') || '').trim();
	var returnUrl = String($os.getenv('DUITKU_RETURN_URL') || '').trim();
	var expiryMinutes = 10;
	var price = Math.floor(Number($os.getenv('WEDEZ_PRO_PRICE')) || 50000);

	if (environment !== 'sandbox' && environment !== 'production') {
		throw new ApiError(503, 'Environment Duitku harus sandbox atau production.');
	}

	if (apiUrl !== expectedApiUrl) {
		throw new ApiError(503, 'URL API Duitku tidak sesuai dengan environment yang dipilih.');
	}

	if (!/^https:\/\//.test(callbackUrl)) {
		throw new ApiError(503, 'Callback URL Duitku harus menggunakan HTTPS.');
	}

	if (!validReturnUrl(returnUrl, environment)) {
		throw new ApiError(503, 'Return URL Duitku tidak valid.');
	}

	if (price < 1000) {
		throw new ApiError(503, 'Harga paket Pro belum dikonfigurasi dengan benar.');
	}

	var merchantCode = String($os.getenv('DUITKU_MERCHANT_CODE') || '').trim();
	var apiKey = String($os.getenv('DUITKU_API_KEY') || '').trim();

	if (!merchantCode || !apiKey) {
		throw new ApiError(503, 'Kredensial Duitku belum dikonfigurasi.');
	}

	return {
		environment: environment,
		merchantCode: merchantCode,
		apiKey: apiKey,
		apiUrl: apiUrl,
		statusUrl: expectedStatusUrl,
		callbackUrl: callbackUrl,
		returnUrl: returnUrl,
		expiryMinutes: expiryMinutes,
		price: price
	};
}

function sendDuitkuRequest(app, request, action) {
	var response;

	try {
		response = $http.send(request);
	} catch (error) {
		app.logger().error('Duitku request failed', 'action', action, 'error', error);
		throw new ApiError(502, 'Tidak dapat terhubung ke layanan pembayaran.');
	}

	if (response.statusCode < 200 || response.statusCode >= 300) {
		var statusMessage =
			response.json && response.json.statusMessage
				? String(response.json.statusMessage)
				: response.json && response.json.Message
					? String(response.json.Message)
					: '';

		if (
			action === 'check-transaction' &&
			response.statusCode === 404 &&
			/^transaction not found$/i.test(statusMessage.trim())
		) {
			return { transactionNotStarted: true };
		}

		app
			.logger()
			.error(
				'Duitku rejected request',
				'action',
				action,
				'status',
				response.statusCode,
				'message',
				statusMessage
			);

		if (response.statusCode === 401 || response.statusCode === 403) {
			throw new ApiError(502, 'Kredensial Duitku ditolak. Periksa Merchant Code dan API key.');
		}

		throw new ApiError(502, 'Duitku tidak dapat memproses pembayaran saat ini.');
	}

	return response.json || {};
}

function createInvoice(app, config, invoice) {
	var timestamp = String(Date.now());
	var signature = $security.hs256(config.merchantCode + timestamp, config.apiKey);

	return sendDuitkuRequest(
		app,
		{
			url: config.apiUrl + '/api/merchant/createInvoice',
			method: 'POST',
			timeout: 20,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json',
				'x-duitku-timestamp': timestamp,
				'x-duitku-signature': signature,
				'x-duitku-merchantcode': config.merchantCode
			},
			body: JSON.stringify(invoice)
		},
		'create-invoice'
	);
}

function checkTransaction(app, config, merchantOrderId, expectedAmount) {
	var signature = $security.hs256(config.merchantCode + merchantOrderId, config.apiKey);
	var response = sendDuitkuRequest(
		app,
		{
			url: config.statusUrl,
			method: 'POST',
			timeout: 20,
			headers: {
				Accept: 'application/json',
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				merchantCode: config.merchantCode,
				merchantOrderId: merchantOrderId,
				signature: signature
			})
		},
		'check-transaction'
	);

	if (response.transactionNotStarted) {
		return {
			merchantOrderId: merchantOrderId,
			reference: '',
			amount: expectedAmount,
			statusCode: '01',
			statusMessage: 'PENDING'
		};
	}

	return response;
}

function getWeddingForAuth(event) {
	var weddingId = String(event.auth.get('wedding_id') || '');

	if (!event.auth.getBool('verified')) {
		throw new ForbiddenError('Verifikasi email terlebih dahulu.');
	}

	if (!weddingId) {
		throw new NotFoundError('Wedding untuk akun ini tidak ditemukan.');
	}

	var wedding = event.app.findRecordById('weddings', weddingId);
	if (wedding.getString('owner') !== event.auth.id)
		throw new ForbiddenError('Undangan bukan milik akun ini.');
	return wedding;
}

function applyPaymentStatus(app, payment, status, reference) {
	var paymentId = payment.id;

	app.runInTransaction(function (txApp) {
		var currentPayment = txApp.findRecordById('payments', paymentId);
		var currentStatus = String(currentPayment.get('status') || 'pending');
		var nextStatus = status;

		if (currentStatus === 'paid' || (currentStatus !== 'pending' && status === 'pending')) {
			nextStatus = currentStatus;
		}

		if (reference && !String(currentPayment.get('provider_reference') || '')) {
			currentPayment.set('provider_reference', reference);
		}

		if (nextStatus !== currentStatus) {
			currentPayment.set('status', nextStatus);
		}

		if (nextStatus === 'paid' && !String(currentPayment.get('paid_at') || '')) {
			currentPayment.set('paid_at', new Date().toISOString());
		}
		if (nextStatus !== 'pending') currentPayment.set('checkout_lock', '');

		txApp.save(currentPayment);

		if (nextStatus === 'paid') {
			// Account deletion can detach the wedding after this request loads
			// the payment. Always use the record re-read inside the transaction.
			var weddingId = currentPayment.getString('wedding');
			if (weddingId) {
				var wedding = txApp.findRecordById('weddings', weddingId);
				if (String(wedding.get('plan_tier') || '') !== 'pro') {
					wedding.set('plan_tier', 'pro');
					txApp.save(wedding);
				}
			}
			// Both callback and status polling use this atomic, idempotent path.
			var affiliate = require(__hooks + '/affiliate_helpers.js');
			affiliate.creditCommission(txApp, currentPayment);
		}
	});

	return String(app.findRecordById('payments', paymentId).get('status') || status);
}

function syncPaymentFromStatus(app, payment, response) {
	var merchantOrderId = String(response.merchantOrderId || '');
	var expectedOrderId = String(payment.get('provider_transaction_id') || '');
	var receivedAmount = Number(response.amount);
	var expectedAmount = Number(payment.get('amount'));

	if (
		!merchantOrderId ||
		merchantOrderId !== expectedOrderId ||
		receivedAmount !== expectedAmount
	) {
		throw new BadRequestError('Data pembayaran Duitku tidak sesuai.');
	}

	var statusCode = String(response.statusCode || '');
	var status = statusCode === '00' ? 'paid' : statusCode === '02' ? 'failed' : 'pending';

	return applyPaymentStatus(app, payment, status, String(response.reference || ''));
}

function paymentResponse(app, weddingId, payment) {
	var config = getConfig();
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
					original_amount: Number(payment.get('original_amount')) || Number(payment.get('amount')),
					discount_amount: Number(payment.get('discount_amount')),
					coupon_code: String(payment.get('coupon_code') || ''),
					currency: String(payment.get('currency') || 'IDR'),
					expires_at: String(payment.get('expires_at') || ''),
					checkout_url: status === 'pending' ? String(payment.get('checkout_url') || '') : ''
				}
			: {
					id: '',
					status: status,
					amount: config.price,
					original_amount: config.price,
					discount_amount: 0,
					coupon_code: '',
					currency: 'IDR',
					expires_at: '',
					checkout_url: ''
				}
	};
}

module.exports = {
	applyPaymentStatus: applyPaymentStatus,
	checkTransaction: checkTransaction,
	createInvoice: createInvoice,
	getConfig: getConfig,
	getWeddingForAuth: getWeddingForAuth,
	paymentHasExpired: paymentHasExpired,
	paymentResponse: paymentResponse,
	syncPaymentFromStatus: syncPaymentFromStatus
};
