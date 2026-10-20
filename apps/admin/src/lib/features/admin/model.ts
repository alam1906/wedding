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
export type AffiliateModerationStatus = Extract<AffiliateStatus, 'active' | 'suspended'>;
export const affiliateStatusLabels: Record<AffiliateStatus, string> = {
	pending: 'Belum aktif',
	active: 'Aktif',
	rejected: 'Dinonaktifkan',
	suspended: 'Ditangguhkan'
};
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
	transfer_proof: string;
	note: string;
	expand?: { affiliate?: AffiliateRecord };
};

export const TRANSFER_PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
export const TRANSFER_PROOF_MAX_SIZE = 5 * 1024 * 1024;

export function transferProofError(file: File): string {
	if (!TRANSFER_PROOF_TYPES.includes(file.type)) return 'Gunakan gambar JPG, PNG, atau WebP.';
	if (!file.size) return 'Gambar bukti transfer tidak boleh kosong.';
	if (file.size > TRANSFER_PROOF_MAX_SIZE) return 'Ukuran gambar maksimal 5 MB.';
	return '';
}

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
