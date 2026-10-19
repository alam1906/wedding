export type AffiliateStatus = 'pending' | 'active' | 'rejected' | 'suspended';
export type CommissionStatus = 'available' | 'reserved' | 'paid' | 'void';
export type PayoutStatus = 'requested' | 'processing' | 'paid' | 'rejected' | 'failed';

export type BankDetails = { bank_name: string; account_number: string; account_name: string };
export type Affiliate = BankDetails & {
	id: string;
	user: string;
	code: string;
	status: AffiliateStatus;
};
export type Commission = {
	id: string;
	amount: number;
	status: CommissionStatus;
	created: string;
	paid_at: string;
	void_reason: string;
};
export type Payout = BankDetails & {
	id: string;
	amount: number;
	status: PayoutStatus;
	created: string;
	paid_at: string;
	transfer_reference: string;
	transfer_proof: string;
	note: string;
};
export type AffiliateOverview = {
	affiliate: Affiliate | null;
	totals: { available: number; reserved: number; paid: number; conversions: number };
	minimum_payout: number;
	discount_percent: number;
	commission_percent: number;
};

export const statusLabels: Record<AffiliateStatus | CommissionStatus | PayoutStatus, string> = {
	pending: 'Belum aktif',
	active: 'Aktif',
	rejected: 'Ditolak',
	suspended: 'Ditangguhkan',
	available: 'Tersedia',
	reserved: 'Dalam pencairan',
	paid: 'Dibayar',
	void: 'Dibatalkan',
	requested: 'Diajukan',
	processing: 'Diproses',
	failed: 'Gagal'
};

export function rupiah(value: number): string {
	return new Intl.NumberFormat('id-ID', {
		style: 'currency',
		currency: 'IDR',
		maximumFractionDigits: 0
	}).format(value);
}

export function shortDate(value: string): string {
	return value
		? new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeZone: 'Asia/Jakarta' }).format(
				new Date(value)
			)
		: '—';
}
