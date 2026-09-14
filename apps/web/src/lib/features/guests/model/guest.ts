export const GUEST_STATUSES = ['pending', 'attending', 'not_attending'] as const;

export type GuestStatus = (typeof GUEST_STATUSES)[number];

export type Guest = {
	id: string;
	created_at: string;
	wedding: string;
	name: string;
	whatsapp: string;
	rsvp_status: GuestStatus;
	message: string;
	rsvp_token: string;
	guest_count: number;
};

export type GuestInput = Pick<
	Guest,
	'name' | 'whatsapp' | 'rsvp_status' | 'message' | 'guest_count'
>;

export const PUBLIC_RSVP_STATUSES = ['attending', 'not_attending'] as const;

export type PublicRsvpStatus = (typeof PUBLIC_RSVP_STATUSES)[number];

export type PublicRsvpGuest = Pick<Guest, 'name' | 'rsvp_status' | 'message'>;

export type PublicRsvpInput = {
	slug: string;
	token: string;
	rsvp_status: PublicRsvpStatus;
	message: string;
};

export type PublicRsvpMessage = Pick<Guest, 'name' | 'rsvp_status' | 'message'>;

export type PublicRsvpMessagePage = {
	items: PublicRsvpMessage[];
	has_more: boolean;
};
