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

	let cachedWedding = $state.raw<WeddingData | null>(null);
	let currentWeddingRequest: Promise<WeddingData> | null = null;
	let cacheGeneration = 0;

	function storeWedding(wedding: WeddingData, generation: number) {
		if (generation === cacheGeneration) {
			cachedWedding = wedding;
		}
	}

	export function getCurrentWedding(): Promise<WeddingData> {
		if (cachedWedding) {
			return Promise.resolve(cachedWedding);
		}

		if (currentWeddingRequest) {
			return currentWeddingRequest;
		}

		const generation = cacheGeneration;
		const request = requestCurrentWedding()
			.then((wedding) => {
				storeWedding(wedding, generation);
				return wedding;
			})
			.finally(() => {
				if (currentWeddingRequest === request) {
					currentWeddingRequest = null;
				}
			});

		currentWeddingRequest = request;
		return request;
	}

	export async function getCurrentWeddingSlug(): Promise<string> {
		return (await getCurrentWedding()).slug;
	}

	export async function getWhatsappTemplate(): Promise<string> {
		const template = (await getCurrentWedding()).whatsapp_template.trim();
		return template || DEFAULT_WHATSAPP_TEMPLATE;
	}

	export async function updateCurrentWedding(
		data: FormData | Record<string, unknown>
	): Promise<WeddingData> {
		const generation = cacheGeneration;
		const wedding = await requestUpdateCurrentWedding(data);
		storeWedding(wedding, generation);
		return wedding;
	}

	export async function saveCurrentWeddingStories(
		stories: WeddingStorySaveInput[]
	): Promise<WeddingStoryItem[]> {
		const generation = cacheGeneration;
		const updatedStories = await requestSaveCurrentWeddingStories(stories);

		if (cachedWedding && generation === cacheGeneration) {
			cachedWedding = { ...cachedWedding, stories: updatedStories };
		}

		return updatedStories;
	}

	export async function updateWhatsappTemplate(template: string): Promise<string> {
		const generation = cacheGeneration;
		const updatedTemplate = await requestUpdateWhatsappTemplate(template);

		if (cachedWedding && generation === cacheGeneration) {
			cachedWedding = { ...cachedWedding, whatsapp_template: updatedTemplate };
		}

		return updatedTemplate;
	}

	export function resetWeddingState() {
		cacheGeneration += 1;
		cachedWedding = null;
		currentWeddingRequest = null;
	}
