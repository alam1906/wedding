import type { GuestInput } from './guest.js';

const MAX_GUESTS_PER_IMPORT = 50;

export type GuestCsvRow = {
	rowNumber: number;
	input: GuestInput;
	normalizedWhatsapp: string;
	issue: string;
};

export class GuestCsvError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'GuestCsvError';
	}
}

function normalizeHeader(value: string): string {
	return value
		.replace(/^\uFEFF/, '')
		.trim()
		.toLocaleLowerCase('id-ID')
		.replace(/[^a-z0-9]+/g, '');
}

function normalizeName(value: string): string {
	return value
		.trim()
		.replace(/\s+/g, ' ')
		.replace(
			/\p{L}[\p{L}\p{M}'’-]*/gu,
			(word) => `${word[0].toLocaleUpperCase('id-ID')}${word.slice(1).toLocaleLowerCase('id-ID')}`
		);
}

function normalizeWhatsapp(value: string): string {
	const digits = value.replace(/\D/g, '');

	if (digits.startsWith('0')) return `+62${digits.slice(1)}`;
	if (digits.startsWith('62')) return `+${digits}`;
	if (digits.startsWith('8')) return `+62${digits}`;
	return '';
}

function countDelimiter(value: string, delimiter: ',' | ';'): number {
	let count = 0;
	let isQuoted = false;

	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];

		if (character === '"') {
			if (isQuoted && value[index + 1] === '"') {
				index += 1;
			} else {
				isQuoted = !isQuoted;
			}
		} else if (!isQuoted && character === delimiter) {
			count += 1;
		} else if (!isQuoted && (character === '\n' || character === '\r')) {
			break;
		}
	}

	return count;
}

function parseRows(value: string, delimiter: ',' | ';'): string[][] {
	const rows: string[][] = [];
	let row: string[] = [];
	let field = '';
	let isQuoted = false;

	for (let index = 0; index < value.length; index += 1) {
		const character = value[index];

		if (character === '"') {
			if (isQuoted && value[index + 1] === '"') {
				field += '"';
				index += 1;
			} else {
				isQuoted = !isQuoted;
			}
			continue;
		}

		if (!isQuoted && character === delimiter) {
			row.push(field);
			field = '';
			continue;
		}

		if (!isQuoted && (character === '\n' || character === '\r')) {
			row.push(field);
			if (row.some((item) => item.trim().length > 0)) rows.push(row);
			row = [];
			field = '';
			if (character === '\r' && value[index + 1] === '\n') index += 1;
			continue;
		}

		field += character;
	}

	if (isQuoted) {
		throw new GuestCsvError('CSV memiliki tanda kutip yang tidak ditutup.');
	}

	row.push(field);
	if (row.some((item) => item.trim().length > 0)) rows.push(row);
	return rows;
}

function findHeader(headers: string[], aliases: string[]): number {
	return headers.findIndex((header) => aliases.includes(header));
}

export function parseGuestCsv(value: string): GuestCsvRow[] {
	const content = value.replace(/^\uFEFF/, '').trim();
	if (!content) throw new GuestCsvError('File CSV kosong.');

	const delimiter = countDelimiter(content, ';') > countDelimiter(content, ',') ? ';' : ',';
	const rows = parseRows(content, delimiter);
	if (rows.length < 2) throw new GuestCsvError('CSV belum memiliki data tamu.');

	const headers = rows[0].map(normalizeHeader);
	const nameIndex = findHeader(headers, ['name', 'nama', 'namatamu']);
	const givenNameIndex = findHeader(headers, ['givenname', 'firstname', 'namadepan']);
	const familyNameIndex = findHeader(headers, ['familyname', 'lastname', 'namabelakang']);
	const whatsappIndexes = headers
		.map((header, index) => ({ header, index }))
		.filter(
			({ header }) =>
				[
					'whatsapp',
					'wa',
					'nomorwa',
					'nomorwhatsapp',
					'phone',
					'phonenumber',
					'telepon',
					'nomortelepon'
				].includes(header) || /^phone\d+value$/.test(header)
		)
		.map(({ index }) => index);
	const guestCountIndex = findHeader(headers, ['guestcount', 'jumlah', 'jumlahtamu', 'kuota']);

	if (nameIndex === -1 && givenNameIndex === -1) {
		throw new GuestCsvError('Kolom nama tidak ditemukan. Gunakan header "name" atau "nama".');
	}

	if (whatsappIndexes.length === 0) {
		throw new GuestCsvError(
			'Kolom WhatsApp tidak ditemukan. Gunakan header "whatsapp" atau "Phone 1 - Value".'
		);
	}

	const dataRows = rows.slice(1);
	if (dataRows.length > MAX_GUESTS_PER_IMPORT) {
		throw new GuestCsvError(`Maksimal ${MAX_GUESTS_PER_IMPORT} tamu dalam satu kali impor.`);
	}

	const seenWhatsapp = new Set<string>();

	return dataRows.map((columns, index) => {
		const combinedName =
			nameIndex >= 0
				? (columns[nameIndex] ?? '')
				: `${columns[givenNameIndex] ?? ''} ${columns[familyNameIndex] ?? ''}`;
		const name = normalizeName(combinedName);
		const phoneCandidates = whatsappIndexes
			.map((phoneIndex) => (columns[phoneIndex] ?? '').trim())
			.filter(Boolean);
		const validPhone = phoneCandidates.find((phone) =>
			/^\+[1-9][0-9]{7,14}$/.test(normalizeWhatsapp(phone))
		);
		const whatsapp = validPhone ?? phoneCandidates[0] ?? '';
		const normalizedWhatsapp = normalizeWhatsapp(whatsapp);
		const rawGuestCount = guestCountIndex >= 0 ? (columns[guestCountIndex] ?? '').trim() : '';
		const guestCount = rawGuestCount ? Number(rawGuestCount) : 1;
		let issue = '';

		if (!name) {
			issue = 'Nama tamu kosong.';
		} else if (!/^\+[1-9][0-9]{7,14}$/.test(normalizedWhatsapp)) {
			issue = 'Nomor WhatsApp tidak valid.';
		} else if (!Number.isInteger(guestCount) || guestCount < 1) {
			issue = 'Jumlah tamu harus berupa angka minimal 1.';
		} else if (seenWhatsapp.has(normalizedWhatsapp)) {
			issue = 'Nomor duplikat di dalam CSV.';
		}

		if (!issue) seenWhatsapp.add(normalizedWhatsapp);

		return {
			rowNumber: index + 2,
			input: {
				name,
				whatsapp: normalizedWhatsapp || whatsapp,
				guest_count: Number.isInteger(guestCount) && guestCount > 0 ? guestCount : 1,
				rsvp_status: 'pending',
				message: ''
			},
			normalizedWhatsapp,
			issue
		};
	});
}
