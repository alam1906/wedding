export type WeddingPlanTier = 'free' | 'pro';

export type WeddingStoryItem = {
	id: string;
	title: string;
	date: string;
	content: string;
	image: string;
	image_url: string;
	sort_order: number;
};

export type WeddingGalleryItem = {
	name: string;
	url: string;
};

export type WeddingData = {
	id: string;
	slug: string;
	theme: string;
	plan_tier: WeddingPlanTier;
	gift_enabled: boolean;
	groom_gift_hidden: boolean;
	bride_gift_hidden: boolean;
	groom_name: string;
	groom_father_name: string;
	groom_mother_name: string;
	groom_photo: string;
	groom_photo_url: string;
	groom_payment_number: string;
	groom_payment_provider: string;
	groom_payment_account_name: string;
	bride_name: string;
	bride_father_name: string;
	bride_mother_name: string;
	bride_photo: string;
	bride_photo_url: string;
	bride_payment_number: string;
	bride_payment_provider: string;
	bride_payment_account_name: string;
	cover: string;
	cover_url: string;
	quote: string;
	address: string;
	separate_events: boolean;
	reception_address: string;
	reception_maps: string;
	maps: string;
	akad: string;
	reception: string;
	music: string;
	music_title: string;
	music_url: string;
	gallery: WeddingGalleryItem[];
	stories: WeddingStoryItem[];
};
