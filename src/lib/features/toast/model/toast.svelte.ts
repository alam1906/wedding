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

function createToastStore() {
	let items = $state<ToastItem[]>([]);
	let nextId = 0;
	const timers = new SvelteMap<number, ReturnType<typeof setTimeout>>();

	function dismiss(id: number) {
		const timer = timers.get(id);

		if (timer) {
			clearTimeout(timer);
			timers.delete(id);
		}

		items = items.filter((item) => item.id !== id);
	}

	function show(message: string, variant: ToastVariant, options: ToastOptions = {}) {
		const id = ++nextId;
		const duration = options.duration ?? DEFAULT_DURATION;

		items = [...items, { id, message, variant }];

		if (duration > 0) {
			timers.set(
				id,
				setTimeout(() => dismiss(id), duration)
			);
		}

		return id;
	}

	return {
		get items() {
			return items;
		},
		dismiss,
		error: (message: string, options?: ToastOptions) => show(message, 'error', options),
		success: (message: string, options?: ToastOptions) => show(message, 'success', options),
		info: (message: string, options?: ToastOptions) => show(message, 'info', options)
	};
}

export const toast = createToastStore();
