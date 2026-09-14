import { createContext } from 'svelte';

import { MusicDataError, requestMusicOptions } from '../api/music.js';
import type { MusicOption } from '../model/music.js';

type MusicOptionsStatus = 'idle' | 'loading' | 'ready' | 'error';

export class MusicOptionsState {
	options = $state.raw<MusicOption[]>([]);
	error = $state('');
	status = $state<MusicOptionsStatus>('idle');
	#request: Promise<void> | null = null;
	#generation = 0;

	load(): Promise<void> {
		if (this.status === 'ready' || this.status === 'error') {
			return Promise.resolve();
		}

		if (this.#request) {
			return this.#request;
		}

		const generation = this.#generation;
		this.status = 'loading';
		this.error = '';

		const request = requestMusicOptions()
			.then((options) => {
				if (generation === this.#generation) {
					this.options = options;
					this.status = 'ready';
				}
			})
			.catch((error) => {
				if (generation === this.#generation) {
					this.options = [];
					this.error =
						error instanceof MusicDataError ? error.message : 'Daftar musik gagal dimuat.';
					this.status = 'error';
				}
			})
			.finally(() => {
				if (this.#request === request) {
					this.#request = null;
				}
			});

		this.#request = request;
		return request;
	}

	reset() {
		this.#generation += 1;
		this.options = [];
		this.error = '';
		this.status = 'idle';
		this.#request = null;
	}
}

export const [getMusicOptionsContext, setMusicOptionsContext] = createContext<MusicOptionsState>();
