import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import { PAYMENT_STATUSES, type ProPaymentState } from '../model/payment.js';

export class PaymentError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'PaymentError';
	}
}

function isProPaymentState(value: unknown): value is ProPaymentState {
	if (
		typeof value !== 'object' ||
		value === null ||
		!('plan_tier' in value) ||
		!('payment' in value)
	) {
		return false;
	}

	const payment = value.payment;

	return (
		(value.plan_tier === 'free' || value.plan_tier === 'pro') &&
		typeof payment === 'object' &&
		payment !== null &&
		'status' in payment &&
		typeof payment.status === 'string' &&
		PAYMENT_STATUSES.includes(payment.status as (typeof PAYMENT_STATUSES)[number]) &&
		'amount' in payment &&
		typeof payment.amount === 'number' &&
		'checkout_url' in payment &&
		typeof payment.checkout_url === 'string'
	);
}

function paymentErrorMessage(error: ClientResponseError): string {
	if (error.status === 401 || error.status === 403) {
		return 'Silakan masuk dan verifikasi akun terlebih dahulu.';
	}

	if (error.status === 0) {
		return 'Tidak dapat terhubung ke layanan pembayaran.';
	}

	return typeof error.response?.message === 'string' && error.response.message
		? error.response.message
		: 'Pembayaran tidak dapat diproses saat ini.';
}

async function paymentRequest(
	path: string,
	method: 'GET' | 'POST',
	body?: Record<string, string>
): Promise<ProPaymentState> {
	try {
		const response = await pocketBase.send<unknown>(path, { method, body });

		if (!isProPaymentState(response)) {
			throw new PaymentError('Respons layanan pembayaran tidak valid.');
		}

		return response;
	} catch (error) {
		if (error instanceof PaymentError) {
			throw error;
		}

		throw new PaymentError(
			error instanceof ClientResponseError
				? paymentErrorMessage(error)
				: 'Pembayaran tidak dapat diproses saat ini.',
			{ cause: error }
		);
	}
}

export function createProPaymentSession(): Promise<ProPaymentState> {
	return paymentRequest('/api/wedez/payments/session', 'POST', {
		return_origin: window.location.origin
	});
}

export function getProPaymentStatus(): Promise<ProPaymentState> {
	return paymentRequest('/api/wedez/payments/status', 'GET');
}
