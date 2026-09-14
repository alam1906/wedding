import { createContext } from 'svelte';

import {
	getCurrentWedding as requestCurrentWedding,
	saveCurrentWeddingStories as requestSaveCurrentWeddingStories,
	updateCurrentWedding as requestUpdateCurrentWedding
} from '../api/wedding.js';
import {
	DEFAULT_WHATSAPP_TEMPLATE,
	updateWhatsappTemplate as requestUpdateWhatsappTemplate
} from '../api/whatsapp-template.js';
import type { WeddingData, WeddingStoryItem, WeddingStorySaveInput } from '../model/wedding.js';

export class WeddingState {
	wedding = $state.raw<WeddingData | null>(null);
	#request: Promise<WeddingData> | null = null;
	#generation = 0;

	#store(wedding: WeddingData, generation: number) {
		if (generation === this.#generation) {
			this.wedding = wedding;
		}
	}

	getCurrentWedding(): Promise<WeddingData> {
		if (this.wedding) {
			return Promise.resolve(this.wedding);
		}

		if (this.#request) {
			return this.#request;
		}

		const generation = this.#generation;
		const request = requestCurrentWedding()
			.then((wedding) => {
				this.#store(wedding, generation);
				return wedding;
			})
			.finally(() => {
				if (this.#request === request) {
					this.#request = null;
				}
			});

		this.#request = request;
		return request;
	}

	async getCurrentWeddingSlug(): Promise<string> {
		return (await this.getCurrentWedding()).slug;
	}

	async getWhatsappTemplate(): Promise<string> {
		const template = (await this.getCurrentWedding()).whatsapp_template.trim();
		return template || DEFAULT_WHATSAPP_TEMPLATE;
	}

	async updateCurrentWedding(data: FormData | Record<string, unknown>): Promise<WeddingData> {
		const generation = this.#generation;
		const wedding = await requestUpdateCurrentWedding(data);
		this.#store(wedding, generation);
		return wedding;
	}

	async saveCurrentWeddingStories(stories: WeddingStorySaveInput[]): Promise<WeddingStoryItem[]> {
		const generation = this.#generation;
		const updatedStories = await requestSaveCurrentWeddingStories(stories);

		if (this.wedding && generation === this.#generation) {
			this.wedding = { ...this.wedding, stories: updatedStories };
		}

		return updatedStories;
	}

	async updateWhatsappTemplate(template: string): Promise<string> {
		const generation = this.#generation;
		const updatedTemplate = await requestUpdateWhatsappTemplate(template);

		if (this.wedding && generation === this.#generation) {
			this.wedding = { ...this.wedding, whatsapp_template: updatedTemplate };
		}

		return updatedTemplate;
	}

	reset() {
		this.#generation += 1;
		this.wedding = null;
		this.#request = null;
	}
}

export const [getWeddingContext, setWeddingContext] = createContext<WeddingState>();
