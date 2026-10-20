import type { WeddingData } from './wedding.js';

// Invitation event times use WIB, regardless of the editor's device timezone.
export function eventDateParts(value: string) {
	const date = new Date(value.replace(' ', 'T'));
	if (!value || Number.isNaN(date.getTime())) return { date: '', time: '' };
	const local = new Date(date.getTime() + 7 * 60 * 60 * 1000).toISOString();
	return { date: local.slice(0, 10), time: local.slice(11, 16) };
}

export function eventDateTimeToISO(date: string, time: string): string {
	if (!date || !time) return '';
	return new Date(`${date}T${time}:00+07:00`).toISOString();
}

export function createEventDraft(wedding: WeddingData) {
	const akad = eventDateParts(wedding.akad);
	const reception = eventDateParts(wedding.reception);
	return {
		separate:
			wedding.separate_events ||
			Boolean(akad.date && reception.date && akad.date !== reception.date),
		date: akad.date || reception.date,
		akadDate: akad.date,
		akadTime: akad.time,
		receptionDate: reception.date,
		receptionTime: reception.time,
		address: wedding.address,
		maps: wedding.maps,
		receptionAddress: wedding.separate_events ? wedding.reception_address : wedding.address,
		receptionMaps: wedding.separate_events ? wedding.reception_maps : wedding.maps
	};
}
