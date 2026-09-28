import PocketBase, { BaseAuthStore } from 'pocketbase';

const configuredUrl = import.meta.env.PUBLIC_POCKETBASE_URL?.trim();

if (!configuredUrl) {
	throw new Error('PUBLIC_POCKETBASE_URL belum dikonfigurasi.');
}

// A superuser token must never be persisted in localStorage on a public origin.
export const pocketBase = new PocketBase(configuredUrl.replace(/\/+$/, ''), new BaseAuthStore());
pocketBase.autoCancellation(false);
