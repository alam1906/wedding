import { createContext } from 'svelte';

import {
	createGuest as requestCreateGuest,
	createGuests as requestCreateGuests,
	deleteGuest as requestDeleteGuest,
	getGuests as requestGuests,
	updateGuest as requestUpdateGuest
} from '../api/guest.js';
import type { Guest, GuestInput } from '../model/guest.js';

function sortGuests(guests: Guest[]): Guest[] {
	return [...guests].sort((left, right) => left.name.localeCompare(right.name, 'id'));
}

export class GuestState {
	guests = $state.raw<Guest[] | null>(null);
	#request: Promise<Guest[]> | null = null;
	#generation = 0;

	#store(guests: Guest[], generation: number) {
		if (generation === this.#generation) {
			this.guests = sortGuests(guests);
		}
	}

	getGuests(): Promise<Guest[]> {
		if (this.guests) {
			return Promise.resolve(this.guests);
		}

		if (this.#request) {
			return this.#request;
		}

		const generation = this.#generation;
		const request = requestGuests()
			.then((guests) => {
				this.#store(guests, generation);
				return guests;
			})
			.finally(() => {
				if (this.#request === request) {
					this.#request = null;
				}
			});

		this.#request = request;
		return request;
	}

	async createGuest(input: GuestInput): Promise<Guest> {
		const generation = this.#generation;
		const guest = await requestCreateGuest(input);

		if (this.guests && generation === this.#generation) {
			this.guests = sortGuests([...this.guests, guest]);
		}

		return guest;
	}

	async createGuests(inputs: GuestInput[]): Promise<Guest[]> {
		const generation = this.#generation;
		const createdGuests = await requestCreateGuests(inputs);

		if (this.guests && generation === this.#generation) {
			this.guests = sortGuests([...this.guests, ...createdGuests]);
		}

		return createdGuests;
	}

	async updateGuest(id: string, input: GuestInput): Promise<Guest> {
		const generation = this.#generation;
		const updatedGuest = await requestUpdateGuest(id, input);

		if (this.guests && generation === this.#generation) {
			this.guests = sortGuests(
				this.guests.map((guest) => (guest.id === id ? updatedGuest : guest))
			);
		}

		return updatedGuest;
	}

	async deleteGuest(id: string): Promise<boolean> {
		const generation = this.#generation;
		const deleted = await requestDeleteGuest(id);

		if (deleted && this.guests && generation === this.#generation) {
			this.guests = this.guests.filter((guest) => guest.id !== id);
		}

		return deleted;
	}

	reset() {
		this.#generation += 1;
		this.guests = null;
		this.#request = null;
	}
}

export const [getGuestContext, setGuestContext] = createContext<GuestState>();
