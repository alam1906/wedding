export const WEDDING_PLAN_TIERS = ['free', 'pro'] as const;

export type WeddingPlanTier = (typeof WEDDING_PLAN_TIERS)[number];

export type WeddingStoryItem = {
	id: string;
	title: string;
	date: string;
	content: string;
	image: string;
	image_url: string;
	sort_order: number;
};

export type WeddingStorySaveInput = {
	id: string;
	title: string;
	date: string;
	content: string;
	imageFile?: File;
	removeImage: boolean;
};

export type WeddingGalleryItem = {
	name: string;
	url: string;
};

export type WeddingData = {
	id: string;
	slug: string;
	theme: string;
	music: string;
	plan_tier: WeddingPlanTier;
	whatsapp_template: string;
	groom_name: string;
	groom_father_name: string;
	groom_mother_name: string;
	groom_photo: string;
	groom_photo_url: string;
	groom_payment_number: string;
	groom_payment_provider: string;
	bride_name: string;
	bride_father_name: string;
	bride_mother_name: string;
	bride_photo: string;
	bride_photo_url: string;
	bride_payment_number: string;
	bride_payment_provider: string;
	cover: string;
	cover_url: string;
	quote: string;
	address: string;
	maps: string;
	akad: string;
	reception: string;
	gallery: WeddingGalleryItem[];
	stories: WeddingStoryItem[];
};

export type WeddingSingleFileField = 'groom_photo' | 'bride_photo' | 'cover';
