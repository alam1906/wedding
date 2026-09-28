import type { RecordModel } from 'pocketbase';

export type Section = 'overview' | 'users' | 'weddings' | 'payments' | 'affiliates' | 'payouts';

export type UserRecord = RecordModel & {
	name: string;
	email: string;
	verified: boolean;
	home_area: string;
};

export type WeddingRecord = RecordModel & {
	groom_name: string;
	bride_name: string;
	slug: string;
	plan_tier: 'free' | 'pro';
	owner: string;
	expand?: { owner?: UserRecord };
};

export type PaymentRecord = RecordModel & {
	wedding: string;
	amount: number;
	status: 'pending' | 'paid' | 'failed' | 'expired' | 'refunded';
	provider_transaction_id: string;
	paid_at: string;
	expand?: { wedding?: WeddingRecord };
};

export type AffiliateStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type AffiliateRecord = RecordModel & {
	user: string;
	code: string;
	status: AffiliateStatus;
	expand?: { user?: UserRecord };
};

export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'rejected' | 'failed';
export type PayoutRecord = RecordModel & {
	affiliate: string;
	amount: number;
	status: PayoutStatus;
	bank_name: string;
	account_name: string;
	account_number: string;
	transfer_reference: string;
	note: string;
	expand?: { affiliate?: AffiliateRecord };
};

export function rupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(value);
}

export function dateTime(value: string): string {
	if (!value) return '—';
	const date = new Date(value);
	return Number.isNaN(date.getTime())
		? '—'
		: new Intl.DateTimeFormat('id-ID', {
				dateStyle: 'medium',
				timeStyle: 'short',
				timeZone: 'Asia/Jakarta'
			}).format(date);
}
