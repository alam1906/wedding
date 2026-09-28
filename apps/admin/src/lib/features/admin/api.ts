import { ClientResponseError, type ListResult, type RecordModel } from 'pocketbase';

import { pocketBase } from '#lib/infrastructure/pocketbase/client.js';
import type {
	AffiliateRecord,
	AffiliateStatus,
	PayoutRecord,
	PayoutStatus,
	Section
} from './model.js';

const collections: Record<Exclude<Section, 'overview'>, string> = {
	users: 'users',
	weddings: 'weddings',
	payments: 'payments',
	affiliates: 'affiliates',
	payouts: 'affiliate_payouts'
};

const searchFields: Partial<Record<Section, string[]>> = {
	users: ['name', 'email'],
	weddings: ['groom_name', 'bride_name', 'slug'],
	payments: ['provider_transaction_id'],
	affiliates: ['code'],
	payouts: ['transfer_reference']
};

const expands: Partial<Record<Section, string>> = {
	weddings: 'owner',
	payments: 'wedding',
	affiliates: 'user',
	payouts: 'affiliate'
};

export async function login(email: string, password: string): Promise<void> {
	await pocketBase.collection('_superusers').authWithPassword(email, password);
	if (pocketBase.authStore.record?.collectionName !== '_superusers') {
		pocketBase.authStore.clear();
		throw new Error('Akun ini bukan superuser PocketBase.');
	}
}

export function logout(): void {
	pocketBase.authStore.clear();
}

export function adminEmail(): string {
	return String(pocketBase.authStore.record?.email ?? '');
}

export function isUnauthorized(error: unknown): boolean {
	return error instanceof ClientResponseError && (error.status === 401 || error.status === 403);
}

export function errorMessage(error: unknown): string {
	if (error instanceof ClientResponseError) {
		if (error.status === 400 || error.status === 401)
			return 'Email atau kata sandi tidak valid, atau sesi telah berakhir.';
		if (error.status === 429) return 'Terlalu banyak permintaan. Coba lagi beberapa saat.';
		if (error.status === 0) return 'Tidak dapat terhubung ke PocketBase.';
		return error.response?.message || `Permintaan gagal (${error.status}).`;
	}
	return error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui.';
}

export async function getOverview(): Promise<Record<string, number>> {
	const [
		users,
		weddings,
		proWeddings,
		paid,
		activeAffiliates,
		pendingAffiliates,
		requestedPayouts
	] = await Promise.all([
		pocketBase.collection('users').getList(1, 1, { fields: 'id' }),
		pocketBase.collection('weddings').getList(1, 1, { fields: 'id' }),
		pocketBase.collection('weddings').getList(1, 1, { filter: 'plan_tier = "pro"', fields: 'id' }),
		pocketBase.collection('payments').getList(1, 1, { filter: 'status = "paid"', fields: 'id' }),
		pocketBase
			.collection('affiliates')
			.getList(1, 1, { filter: 'status = "active"', fields: 'id' }),
		pocketBase
			.collection('affiliates')
			.getList(1, 1, { filter: 'status = "pending"', fields: 'id' }),
		pocketBase
			.collection('affiliate_payouts')
			.getList(1, 1, { filter: 'status = "requested"', fields: 'id' })
	]);
	return {
		users: users.totalItems,
		weddings: weddings.totalItems,
		proWeddings: proWeddings.totalItems,
		paid: paid.totalItems,
		activeAffiliates: activeAffiliates.totalItems,
		pendingAffiliates: pendingAffiliates.totalItems,
		requestedPayouts: requestedPayouts.totalItems
	};
}

export async function getRecords<T extends RecordModel>(
	section: Exclude<Section, 'overview'>,
	page: number,
	search: string,
	status: string
): Promise<ListResult<T>> {
	const term = search.trim();
	const filters: string[] = [];
	if (term) {
		const fields = searchFields[section] ?? [];
		filters.push(
			'(' +
				fields.map((field) => pocketBase.filter(`${field} ~ {:term}`, { term })).join(' || ') +
				')'
		);
	}
	if (status && (section === 'payments' || section === 'affiliates' || section === 'payouts')) {
		filters.push(pocketBase.filter('status = {:status}', { status }));
	}
	return pocketBase.collection(collections[section]).getList<T>(page, 15, {
		sort: '-created',
		...(filters.length ? { filter: filters.join(' && ') } : {}),
		...(expands[section] ? { expand: expands[section] } : {})
	});
}

export async function setAffiliateStatus(
	record: AffiliateRecord,
	status: AffiliateStatus
): Promise<void> {
	await pocketBase.collection('affiliates').update(record.id, { status });
}

export async function setPayoutStatus(
	record: PayoutRecord,
	status: PayoutStatus,
	detail = ''
): Promise<void> {
	await pocketBase.collection('affiliate_payouts').update(record.id, {
		status,
		...(status === 'paid' ? { transfer_reference: detail } : {}),
		...(status === 'rejected' || status === 'failed' ? { note: detail } : {})
	});
}
