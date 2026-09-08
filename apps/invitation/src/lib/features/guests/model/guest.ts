export const PUBLIC_RSVP_STATUSES = ['attending', 'not_attending'] as const;

export type PublicRsvpStatus = (typeof PUBLIC_RSVP_STATUSES)[number];

export type PublicRsvpGuest = {
	name: string;
	rsvp_status: 'pending' | PublicRsvpStatus;
	message: string;
};

export type PublicRsvpInput = {
	slug: string;
	token: string;
	rsvp_status: PublicRsvpStatus;
	message: string;
};

export type PublicRsvpMessage = PublicRsvpGuest;

export type PublicRsvpMessagePage = {
	items: PublicRsvpMessage[];
	has_more: boolean;
};
