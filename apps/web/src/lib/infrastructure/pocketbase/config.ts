const configuredPocketBaseUrl = import.meta.env.PUBLIC_POCKETBASE_URL?.trim();

if (!configuredPocketBaseUrl) {
	throw new Error('PUBLIC_POCKETBASE_URL belum dikonfigurasi.');
}

export const pocketBaseUrl = configuredPocketBaseUrl.replace(/\/+$/, '');
