import PocketBase, { LocalAuthStore } from 'pocketbase';

import { pocketBaseUrl } from './config.js';

export const pocketBase = new PocketBase(pocketBaseUrl, new LocalAuthStore('wedez_auth'));
