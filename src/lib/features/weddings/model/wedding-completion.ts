export const WEDDING_COMPLETION_FIELDS = [
	'theme',
	'groom_name',
	'groom_father_name',
	'groom_mother_name',
	'groom_photo',
	'groom_payment_number',
	'groom_payment_provider',
	'bride_name',
	'bride_father_name',
	'bride_mother_name',
	'bride_photo',
	'bride_payment_number',
	'bride_payment_provider',
	'cover',
	'quote',
	'address',
	'maps',
	'akad',
	'reception',
	'gallery',
	'stories'
] as const;

export type WeddingCompletionField = (typeof WEDDING_COMPLETION_FIELDS)[number];

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
	record: Partial<Record<WeddingCompletionField, unknown>>
): WeddingCompletion {
	const totalFields = WEDDING_COMPLETION_FIELDS.length;
	const completedFields = WEDDING_COMPLETION_FIELDS.filter((field) =>
		hasValue(record[field])
	).length;

	return {
		completedFields,
		totalFields,
		percentage: Math.round((completedFields / totalFields) * 100)
	};
}
