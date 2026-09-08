import type { WeddingPlanTier } from '#lib/features/weddings/index.js';

export const PAYMENT_STATUSES = ['idle', 'pending', 'paid', 'failed', 'expired'] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type ProPayment = {
	id: string;
	status: PaymentStatus;
	amount: number;
	currency: 'IDR';
	expires_at: string;
	checkout_url: string;
};

export type ProPaymentState = {
	plan_tier: WeddingPlanTier;
	payment: ProPayment;
};
