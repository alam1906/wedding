import type { PublicRsvpGuest, PublicRsvpMessagePage, PublicRsvpStatus } from './guest.js';

// Not a valid wedding slug: demo requests must never reach PocketBase.
export const DEMO_WEDDING_SLUG = '__wedez_theme_preview__';
export const DEMO_RSVP_TOKEN = 'wedez-preview-guest';

const initialMessages: PublicRsvpGuest[] = [
	{
		name: 'Dinda',
		rsvp_status: 'attending',
		message:
			'Selamat menempuh hidup baru, Raka dan Laras. Semoga selalu saling menjaga dan menyayangi.'
	},
	{
		name: 'Bagas',
		rsvp_status: 'attending',
		message:
			'Semoga menjadi keluarga yang penuh kebahagiaan. Sampai bertemu di hari istimewa kalian!'
	},
	{
		name: 'Nadia',
		rsvp_status: 'not_attending',
		message: 'Doa terbaik untuk kalian berdua. Semoga cinta dan kebahagiaan selalu menyertai.'
	},
	{
		name: 'Fajar',
		rsvp_status: 'attending',
		message: 'Selamat untuk Raka dan Laras. Semoga perjalanan baru ini dipenuhi berkah.'
	}
];

// Kept in this browser tab only. Reloading restores the original demo.
let guest: PublicRsvpGuest = { name: 'Tamu Undangan', rsvp_status: 'pending', message: '' };

export function getDemoGuest(): PublicRsvpGuest {
	return { ...guest };
}

export function submitDemoGuest(rsvp_status: PublicRsvpStatus, message: string): PublicRsvpGuest {
	guest = { ...guest, rsvp_status, message };
	return getDemoGuest();
}

export function getDemoMessages(page: number): PublicRsvpMessagePage {
	const messages = guest.message ? [guest, ...initialMessages] : initialMessages;
	const start = (page - 1) * 3;
	return {
		items: messages.slice(start, start + 3).map((item) => ({ ...item })),
		has_more: start + 3 < messages.length
	};
}
