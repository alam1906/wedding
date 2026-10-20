import type { WeddingCompletion } from './wedding-completion.js';
import type { WeddingPlanTier } from './wedding.js';

export const WEDDING_SECTIONS = [
	'Domain',
	'Mempelai',
	'Acara',
	'Media',
	'Story',
	'Quote',
	'Kado',
	'Musik',
	'Tema'
] as const;
export type WeddingSection = (typeof WEDDING_SECTIONS)[number];

export type WeddingSummary = {
	id: string;
	slug: string;
	plan_tier: WeddingPlanTier;
	completion: WeddingCompletion;
	sections: Record<WeddingSection, boolean>;
};

export type DashboardSummary = Pick<WeddingSummary, 'slug' | 'plan_tier' | 'completion'> & {
	guests: { total: number; attending: number; notAttending: number; pending: number };
};
