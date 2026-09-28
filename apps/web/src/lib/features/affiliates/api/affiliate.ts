import { ClientResponseError, type ListResult } from 'pocketbase';
import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import type {
	Affiliate,
	AffiliateOverview,
	BankDetails,
	Commission,
	Payout
} from '../model/affiliate.js';

export function affiliateError(error: unknown): string {
	if (error instanceof ClientResponseError) {
		if (error.status === 0) return 'Tidak dapat terhubung ke server. Silakan coba lagi.';
		if (error.status === 429) return 'Terlalu banyak permintaan. Tunggu sebentar lalu coba lagi.';
		if (typeof error.response.message === 'string') return error.response.message;
	}
	return 'Data affiliate gagal diproses. Silakan coba lagi.';
}

export function getAffiliateOverview(fetch?: typeof globalThis.fetch): Promise<AffiliateOverview> {
	return pocketBase.send('/api/wedez/affiliate/me', { method: 'GET', fetch });
}

export function enrollAffiliate(): Promise<Affiliate> {
	return pocketBase.send('/api/wedez/affiliate/enroll', { method: 'POST' });
}

export function saveAffiliateBank(bank: BankDetails): Promise<Affiliate> {
	return pocketBase.send('/api/wedez/affiliate/bank', { method: 'PATCH', body: bank });
}

export function requestAffiliatePayout(): Promise<Payout> {
	return pocketBase.send('/api/wedez/affiliate/payouts', { method: 'POST' });
}

export function getCommissions(page: number): Promise<ListResult<Commission>> {
	return pocketBase.collection('affiliate_commissions').getList<Commission>(page, 20, {
		sort: '-created,-id',
		fields: 'id,amount,status,created,paid_at,void_reason'
	});
}

export function getPayouts(page: number): Promise<ListResult<Payout>> {
	return pocketBase.collection('affiliate_payouts').getList<Payout>(page, 20, {
		sort: '-created,-id',
		fields:
			'id,amount,status,created,paid_at,bank_name,account_number,account_name,transfer_reference,note'
	});
}
