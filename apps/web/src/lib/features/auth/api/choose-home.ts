import { pocketBase } from '#lib/infrastructure/pocketbase/index.js';
import { hasWedding, type AccountIntent } from '../model/navigation.js';

async function chooseHome(area: AccountIntent): Promise<void> {
	const userId = pocketBase.authStore.record?.id;
	if (!pocketBase.authStore.isValid || !userId) throw new Error('Sesi akun telah berakhir.');
	if (area === 'wedding' && !hasWedding()) throw new Error('Undangan belum tersedia.');
	const user = await pocketBase.collection('users').update(userId, { home_area: area });
	if (user.home_area !== area) throw new Error('Tujuan masuk belum tersimpan.');
	pocketBase.authStore.save(pocketBase.authStore.token, user);
}

export const chooseAffiliateHome = () => chooseHome('affiliate');
export const chooseWeddingHome = () => chooseHome('wedding');
