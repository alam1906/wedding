import { createContext } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

export type ToastVariant = 'error' | 'success' | 'info';

export type ToastItem = {
	id: number;
	message: string;
	variant: ToastVariant;
};

type ToastOptions = {
	duration?: number;
};

const DEFAULT_DURATION = 5_000;

export class ToastState {
	items = $state<ToastItem[]>([]);
	#nextId = 0;
	#timers = new SvelteMap<number, ReturnType<typeof setTimeout>>();

	dismiss(id: number) {
		const timer = this.#timers.get(id);

		if (timer) {
			clearTimeout(timer);
			this.#timers.delete(id);
		}

		this.items = this.items.filter((item) => item.id !== id);
	}

	show(message: string, variant: ToastVariant, options: ToastOptions = {}) {
		const duplicate = this.items.find(
			(item) => item.message === message && item.variant === variant
		);

		if (duplicate) {
			this.dismiss(duplicate.id);
		}

		const id = ++this.#nextId;
		const duration = options.duration ?? DEFAULT_DURATION;

		this.items = [...this.items, { id, message, variant }];

		if (duration > 0) {
			this.#timers.set(
				id,
				setTimeout(() => this.dismiss(id), duration)
			);
		}

		return id;
	}

	error(message: string, options?: ToastOptions) {
		return this.show(message, 'error', options);
	}

	success(message: string, options?: ToastOptions) {
		return this.show(message, 'success', options);
	}

	info(message: string, options?: ToastOptions) {
		return this.show(message, 'info', options);
	}

	reset() {
		for (const timer of this.#timers.values()) {
			clearTimeout(timer);
		}

		this.#timers.clear();
		this.items = [];
		this.#nextId = 0;
	}
}

export const [getToastContext, setToastContext] = createContext<ToastState>();
