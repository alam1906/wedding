import { ClientResponseError } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import {
	PAYMENT_STATUSES,
	type ProPaymentState,
	type PaymentQuote,
	type PaymentMethods
} from '../model/payment.js';

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
		'environment' in value &&
		(value.environment === 'sandbox' || value.environment === 'production') &&
		'server_time' in value &&
		typeof value.server_time === 'string' &&
		Number.isFinite(Date.parse(value.server_time)) &&
		typeof payment === 'object' &&
		payment !== null &&
		'status' in payment &&
		typeof payment.status === 'string' &&
		PAYMENT_STATUSES.includes(payment.status as (typeof PAYMENT_STATUSES)[number]) &&
		'amount' in payment &&
		typeof payment.amount === 'number' &&
		'original_amount' in payment &&
		typeof payment.original_amount === 'number' &&
		'discount_amount' in payment &&
		typeof payment.discount_amount === 'number' &&
		'coupon_code' in payment &&
		typeof payment.coupon_code === 'string' &&
		'checkout_url' in payment &&
		typeof payment.checkout_url === 'string' &&
		['id', 'expires_at', 'order_id', 'method', 'method_name', 'va_number', 'qr_string'].every(
			(key) => key in payment && typeof (payment as Record<string, unknown>)[key] === 'string'
		) &&
		'kind' in payment &&
		['', 'qris', 'va'].includes(String(payment.kind)) &&
		'fee' in payment &&
		Number.isSafeInteger(payment.fee) &&
		Number(payment.fee) >= 0 &&
		'total' in payment &&
		Number.isSafeInteger(payment.total) &&
		payment.total === payment.amount + Number(payment.fee) &&
		Number.isSafeInteger(payment.amount) &&
		payment.amount > 0 &&
		payment.original_amount - payment.discount_amount === payment.amount
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
	body?: Record<string, string | number>
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

export function createProPaymentSession(
	couponCode: string,
	paymentMethod: string,
	expectedAmount: number,
	expectedFee: number
): Promise<ProPaymentState> {
	return paymentRequest('/api/wedez/payments/session', 'POST', {
		couponCode,
		paymentMethod,
		expectedAmount,
		expectedFee
	});
}

function isPaymentQuote(result: PaymentQuote): boolean {
	return Boolean(
		result &&
		Number.isSafeInteger(result.original_amount) &&
		Number.isSafeInteger(result.amount) &&
		Number.isSafeInteger(result.discount_amount) &&
		result.amount > 0 &&
		result.discount_amount >= 0 &&
		result.original_amount - result.discount_amount === result.amount &&
		typeof result.coupon_code === 'string'
	);
}

export async function getPaymentMethods(couponCode: string): Promise<PaymentMethods> {
	try {
		const result = await pocketBase.send<PaymentMethods>('/api/wedez/payments/methods', {
			method: 'POST',
			body: { couponCode }
		});
		if (
			!result ||
			!isPaymentQuote(result.quote) ||
			!['sandbox', 'production'].includes(result.environment) ||
			!Array.isArray(result.methods) ||
			!result.methods.every(
				(method) =>
					method &&
					typeof method.code === 'string' &&
					typeof method.name === 'string' &&
					['qris', 'va'].includes(method.kind) &&
					Number.isSafeInteger(method.fee) &&
					method.fee >= 0
			)
		)
			throw new PaymentError('Daftar metode pembayaran tidak valid. Silakan coba lagi.');
		return result;
	} catch (error) {
		if (error instanceof PaymentError) throw error;
		throw new PaymentError(
			error instanceof ClientResponseError
				? paymentErrorMessage(error)
				: 'Metode pembayaran belum dapat dimuat.',
			{ cause: error }
		);
	}
}

export async function getPaymentQuote(couponCode: string): Promise<PaymentQuote> {
	try {
		const result = await pocketBase.send<PaymentQuote>('/api/wedez/payments/quote', {
			method: 'POST',
			body: { couponCode }
		});
		if (!isPaymentQuote(result)) {
			throw new PaymentError('Respons harga tidak valid. Silakan muat ulang halaman.');
		}
		return result;
	} catch (error) {
		if (error instanceof PaymentError) throw error;
		throw new PaymentError(
			error instanceof ClientResponseError
				? paymentErrorMessage(error)
				: 'Kupon belum dapat diperiksa.',
			{ cause: error }
		);
	}
}

export function getProPaymentStatus(refresh = true): Promise<ProPaymentState> {
	// Automatic polling reads callback-updated DB state, not the gateway.
	return paymentRequest(`/api/wedez/payments/status${refresh ? '' : '?refresh=false'}`, 'GET');
}
