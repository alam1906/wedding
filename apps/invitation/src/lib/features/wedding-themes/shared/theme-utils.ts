export type EventDate = {
	date: string;
	time: string;
};

export type CountdownValue = {
	days: number;
	hours: number;
	minutes: number;
	seconds: number;
	isElapsed: boolean;
};

export function formatPersonName(value: string): string {
	return value
		.trim()
		.toLocaleLowerCase('id-ID')
		.replace(
			/(^|[\s'-])(\p{L})/gu,
			(_, prefix: string, letter: string) => `${prefix}${letter.toLocaleUpperCase('id-ID')}`
		);
}

export function formatEventDate(value: string): EventDate {
	if (!value) {
		return { date: 'Tanggal belum ditentukan', time: 'Waktu belum ditentukan' };
	}

	const date = new Date(value.replace(' ', 'T'));
	if (Number.isNaN(date.getTime())) {
		return { date: value, time: '' };
	}

	return {
		date: new Intl.DateTimeFormat('id-ID', {
			weekday: 'long',
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		}).format(date),
		time: `${new Intl.DateTimeFormat('id-ID', {
			hour: '2-digit',
			minute: '2-digit'
		}).format(date)} WIB`
	};
}

export function formatStoryDate(value: string): string {
	if (!value) {
		return '';
	}

	const date = new Date(value.replace(' ', 'T'));
	if (Number.isNaN(date.getTime())) {
		return value;
	}

	return new Intl.DateTimeFormat('id-ID', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	}).format(date);
}

export function calculateCountdown(value: string): CountdownValue {
	const targetTime = new Date(value.replace(' ', 'T')).getTime();
	const remaining = Number.isNaN(targetTime) ? 0 : Math.max(0, targetTime - Date.now());

	return {
		days: Math.floor(remaining / 86_400_000),
		hours: Math.floor((remaining % 86_400_000) / 3_600_000),
		minutes: Math.floor((remaining % 3_600_000) / 60_000),
		seconds: Math.floor((remaining % 60_000) / 1_000),
		isElapsed: !Number.isNaN(targetTime) && targetTime <= Date.now()
	};
}

export function safeExternalURL(value: string): string | null {
	try {
		const url = new URL(value);
		return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null;
	} catch {
		return null;
	}
}
