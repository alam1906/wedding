import PocketBase from 'pocketbase';

import { pocketBaseUrl } from './config.js';

export const pocketBase = new PocketBase(pocketBaseUrl);
