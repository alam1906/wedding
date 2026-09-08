import { calculateWeddingCompletion, type WeddingCompletion } from '../model/wedding-completion.js';
import { getCurrentWedding, WeddingDataError } from './wedding.js';

export class WeddingQueryError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'WeddingQueryError';
	}
}

export async function getWeddingCompletion(): Promise<WeddingCompletion> {
	try {
		return calculateWeddingCompletion(await getCurrentWedding());
	} catch (error) {
		if (error instanceof WeddingQueryError) {
			throw error;
		}

		const message =
			error instanceof WeddingDataError ? error.message : 'Progres data undangan gagal dimuat.';

		throw new WeddingQueryError(message, { cause: error });
	}
}
