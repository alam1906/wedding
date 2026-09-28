import type { WeddingPlanTier } from '#lib/features/weddings/index.js';

export const PAYMENT_STATUSES = ['idle', 'pending', 'paid', 'failed', 'expired'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ProPayment = {
	id: string;
	status: PaymentStatus;
	amount: number;
	original_amount: number;
	discount_amount: number;
	coupon_code: string;
	currency: 'IDR';
	expires_at: string;
	checkout_url: string;
};

export type ProPaymentState = {
	plan_tier: WeddingPlanTier;
	payment: ProPayment;
};

export type PaymentQuote = {
	original_amount: number;
	amount: number;
	discount_amount: number;
	discount_percent: number;
	coupon_code: string;
};
