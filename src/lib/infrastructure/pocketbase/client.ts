import PocketBase, { LocalAuthStore } from 'pocketbase';

import { pocketBaseUrl } from './config';

export const pocketBase = new PocketBase(pocketBaseUrl, new LocalAuthStore('wedez_auth'));
