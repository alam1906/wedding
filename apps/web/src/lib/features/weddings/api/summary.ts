import { ClientResponseError } from 'pocketbase';
import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import {
	WEDDING_SECTIONS,
	type DashboardSummary,
	type WeddingSummary
} from '../model/wedding-summary.js';
import { WeddingDataError } from './wedding.js';

function isSummary(
	value: unknown
): value is Pick<WeddingSummary, 'slug' | 'plan_tier' | 'completion'> {
	if (!value || typeof value !== 'object') return false;
	const data = value as WeddingSummary;
	return (
		typeof data.slug === 'string' &&
		(data.plan_tier === 'free' || data.plan_tier === 'pro') &&
		!!data.completion &&
		['completedFields', 'totalFields', 'percentage'].every((key) =>
			Number.isFinite(data.completion[key as keyof typeof data.completion])
		)
	);
}

async function requestSummary<T>(path: string, validate: (value: unknown) => boolean): Promise<T> {
	try {
		const response = await pocketBase.send<T>(path, { method: 'GET', cache: 'no-store' });
		if (!validate(response)) throw new WeddingDataError('Respons ringkasan undangan tidak valid.');
		return response;
	} catch (cause) {
		if (cause instanceof WeddingDataError) throw cause;
		throw new WeddingDataError(
			cause instanceof ClientResponseError && cause.status === 0
				? 'Tidak dapat terhubung ke server.'
				: 'Ringkasan undangan gagal dimuat. Silakan coba lagi.',
			{ cause }
		);
	}
}

export function getWeddingSummary(): Promise<WeddingSummary> {
	return requestSummary('/api/wedez/weddings/summary', (value) => {
		if (!isSummary(value)) return false;
		const data = value as WeddingSummary;
		return (
			typeof data.id === 'string' &&
			!!data.sections &&
			WEDDING_SECTIONS.every((section) => typeof data.sections[section] === 'boolean')
		);
	});
}

export function getDashboardSummary(): Promise<DashboardSummary> {
	return requestSummary('/api/wedez/dashboard', (value) => {
		if (!isSummary(value)) return false;
		const data = value as DashboardSummary;
		return (
			!!data.guests &&
			['total', 'attending', 'notAttending', 'pending'].every(
				(key) =>
					Number.isSafeInteger(data.guests[key as keyof typeof data.guests]) &&
					data.guests[key as keyof typeof data.guests] >= 0
			)
		);
	});
}
