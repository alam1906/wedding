import { redirect } from '@sveltejs/kit';
import { isAuthenticated } from '#lib/features/auth/index.js';
export function load() {
	redirect(
		307,
		isAuthenticated() ? '/affiliate/dashboard' : '/register?next=%2Faffiliate%2Fdashboard'
	);
}
