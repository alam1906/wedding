export const WEDDING_COMPLETION_FIELDS = [
	'theme',
	'groom_name',
	'groom_father_name',
	'groom_mother_name',
	'groom_photo',
	'groom_payment_number',
	'groom_payment_provider',
	'groom_payment_account_name',
	'bride_name',
	'bride_father_name',
	'bride_mother_name',
	'bride_photo',
	'bride_payment_number',
	'bride_payment_provider',
	'bride_payment_account_name',
	'cover',
	'quote',
	'address',
	'reception_address',
	'maps',
	'akad',
	'reception',
	'gallery',
	'stories'
] as const;

export type WeddingCompletionField = (typeof WEDDING_COMPLETION_FIELDS)[number];

const GIFT_COMPLETION_FIELDS = new Set<WeddingCompletionField>([
	'groom_payment_number',
	'groom_payment_provider',
	'groom_payment_account_name',
	'bride_payment_number',
	'bride_payment_provider',
	'bride_payment_account_name'
]);

export type WeddingCompletion = {
	completedFields: number;
	percentage: number;
	totalFields: number;
};

function hasValue(value: unknown): boolean {
	if (typeof value === 'string') {
		return value.trim().length > 0;
	}

	if (Array.isArray(value)) {
		return value.length > 0;
	}

	if (typeof value === 'number') {
		return Number.isFinite(value) && value !== 0;
	}

	return value !== null && value !== undefined;
}

export function calculateWeddingCompletion(
	record: Partial<Record<WeddingCompletionField, unknown>> & {
		gift_enabled?: boolean;
		groom_gift_hidden?: boolean;
		bride_gift_hidden?: boolean;
		separate_events?: boolean;
	}
): WeddingCompletion {
	const fields = WEDDING_COMPLETION_FIELDS.filter(
		(field) =>
			!(record.gift_enabled === false && GIFT_COMPLETION_FIELDS.has(field)) &&
			!(record.groom_gift_hidden === true && field.startsWith('groom_payment_')) &&
			!(record.bride_gift_hidden === true && field.startsWith('bride_payment_')) &&
			(field !== 'reception_address' || record.separate_events === true)
	);
	const totalFields = fields.length;
	const completedFields = fields.filter((field) => hasValue(record[field])).length;

	return {
		completedFields,
		totalFields,
		percentage: Math.round((completedFields / totalFields) * 100)
	};
}
