import {
	createGuest as requestCreateGuest,
	deleteGuest as requestDeleteGuest,
	getGuests as requestGuests,
	updateGuest as requestUpdateGuest
} from '../api/guest.js';
import type { Guest, GuestInput } from '../model/guest.js';

let cachedGuests = $state.raw<Guest[] | null>(null);
let guestsRequest: Promise<Guest[]> | null = null;
let cacheGeneration = 0;

function sortGuests(guests: Guest[]): Guest[] {
	return [...guests].sort((left, right) => left.name.localeCompare(right.name, 'id'));
}

function storeGuests(guests: Guest[], generation: number) {
	if (generation === cacheGeneration) {
		cachedGuests = sortGuests(guests);
	}
}

export function getGuests(): Promise<Guest[]> {
	if (cachedGuests) {
		return Promise.resolve(cachedGuests);
	}

	if (guestsRequest) {
		return guestsRequest;
	}

	const generation = cacheGeneration;
	const request = requestGuests()
		.then((guests) => {
			storeGuests(guests, generation);
			return guests;
		})
		.finally(() => {
			if (guestsRequest === request) {
				guestsRequest = null;
			}
		});

	guestsRequest = request;
	return request;
}

export async function createGuest(input: GuestInput): Promise<Guest> {
	const generation = cacheGeneration;
	const guest = await requestCreateGuest(input);

	if (cachedGuests && generation === cacheGeneration) {
		cachedGuests = sortGuests([...cachedGuests, guest]);
	}

	return guest;
}

export async function updateGuest(id: string, input: GuestInput): Promise<Guest> {
	const generation = cacheGeneration;
	const updatedGuest = await requestUpdateGuest(id, input);

	if (cachedGuests && generation === cacheGeneration) {
		cachedGuests = sortGuests(
			cachedGuests.map((guest) => (guest.id === id ? updatedGuest : guest))
		);
	}

	return updatedGuest;
}

export async function deleteGuest(id: string): Promise<boolean> {
	const generation = cacheGeneration;
	const deleted = await requestDeleteGuest(id);

	if (deleted && cachedGuests && generation === cacheGeneration) {
		cachedGuests = cachedGuests.filter((guest) => guest.id !== id);
	}

	return deleted;
}

export function resetGuestState() {
	cacheGeneration += 1;
	cachedGuests = null;
	guestsRequest = null;
}
