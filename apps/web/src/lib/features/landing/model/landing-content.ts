export const landingStats = [
	{ value: '5 menit', label: 'Mulai membuat' },
	{ value: '50+', label: 'Tema pilihan' },
	{ value: '1 link', label: 'Untuk semua tamu' },
	{ value: '24/7', label: 'Bisa diperbarui' }
] as const;

export const landingReasons = [
	{
		title: 'Desain Eksklusif',
		description:
			'Setiap tema dirancang dengan detail yang matang agar undangan kalian terasa personal, modern, dan tidak pasaran.',
		image: '/images/why-wedez/exclusive-design.webp',
		alt: 'Ilustrasi rangkaian kartu undangan pernikahan premium dengan detail botanical',
		color: '#e2d2ff'
	},
	{
		title: 'Edit Mudah Tanpa Skills',
		description:
			'Ubah teks, foto, jadwal, dan tampilan langsung dari dashboard yang sederhana tanpa perlu memahami coding atau desain.',
		image: '/images/why-wedez/easy-editing.webp',
		alt: 'Ilustrasi laptop dengan editor visual undangan pernikahan yang mudah digunakan',
		color: '#e5fa94'
	},
	{
		title: 'Fitur Lengkap',
		description:
			'Galeri, lokasi acara, daftar tamu, RSVP, hingga informasi kado tersusun rapi dalam satu undangan digital.',
		image: '/images/why-wedez/complete-features.webp',
		alt: 'Ilustrasi fitur lengkap undangan digital dalam tampilan dashboard',
		color: '#ffb8a5'
	},
	{
		title: 'Harga Terjangkau',
		description:
			'Mulai membuat secara gratis dan pilih paket saat sudah siap, tanpa biaya berlangganan yang membebani.',
		image: '/images/why-wedez/affordable-price.webp',
		alt: 'Ilustrasi undangan pernikahan elegan dengan koin dan cincin emas',
		color: '#c5e7ff'
	}
] as const;

export const landingDashboards = [
	{
		id: 'features-title',
		title: 'Dashboard pengantin',
		description: 'Semua informasi penting tersedia dalam satu tempat yang mudah dipahami.',
		image: '/images/dashboard/overview.webp',
		alt: 'Dashboard Wedez dengan progres undangan, paket aktif, dan statistik RSVP tamu',
		color: '#e2d2ff',
		benefits: [
			{
				title: 'Tautan personal',
				description: 'Sapa setiap tamu dengan nama mereka melalui tautan undangan yang personal.'
			},
			{
				title: 'RSVP terorganisir',
				description: 'Pantau siapa yang hadir, tidak hadir, dan belum memberikan jawaban.'
			},
			{
				title: 'Mudah diedit',
				description: 'Perbarui informasi acara kapan saja tanpa harus mengirim ulang undangan.'
			}
		]
	},
	{
		id: 'affiliate-title',
		title: 'Dashboard affiliate',
		description:
			'Bantu calon pengantin menemukan undangan favoritnya. Bagikan kode kuponmu dan pantau komisi dari setiap pembayaran berhasil, semuanya lewat satu dashboard.',
		image: '/images/dashboard/affiliate.webp',
		alt: 'Dashboard affiliate Wedez dengan kode kupon, saldo komisi, pembayaran berhasil, dan progres pencairan',
		color: '#e5fa94',
		benefits: [
			{
				title: 'Bagikan kode, dapatkan komisi',
				description: 'Bagikan kode kuponmu dan dapatkan komisi untuk setiap pembayaran berhasil.'
			},
			{
				title: 'Komisi transparan',
				description:
					'Pantau saldo tersedia, pembayaran berhasil, dan riwayat komisi langsung dari dashboard.'
			},
			{
				title: 'Pencairan mudah dipantau',
				description: 'Ajukan pencairan saldo ke rekeningmu dan ikuti statusnya dalam satu tempat.'
			}
		]
	}
] as const;

export const landingPlans = [
	{
		name: 'Free',
		price: 'Rp0',
		description: 'Mulai merancang undangan dan lihat hasilnya sebelum dipublikasikan.',
		features: ['Tema Terbatas', 'Tamu Terbatas', 'Ada Watermark'],
		featured: false
	},
	{
		name: 'Pro',
		price: 'Rp50rb',
		description: 'Semua yang dibutuhkan untuk membagikan dan mengelola undangan kalian.',
		features: ['Semua Tema Premium', 'Unlimited Tamu', 'No Watermark'],
		featured: true
	}
] as const;

export const landingFaqs = [
	{
		question: 'Apakah Wedez gratis digunakan?',
		answer:
			'Ya, Wedez menyediakan paket gratis dengan tema dasar dan maksimal 100 tamu. Paket Pro membuka semua tema premium, tamu tanpa batas, dan menghilangkan watermark.'
	},
	{
		question: 'Bagaimana cara membuat undangan di Wedez?',
		answer:
			'Anda dapat membuat undangan dengan mendaftar di website kami, mengisi form, memilih tema, menyesuaikan konten, dan mengirimkannya kepada tamu melalui link.'
	},
	{
		question: 'Bagaimana cara upgrade ke Premium?',
		answer:
			'Anda dapat upgrade langsung di dashboard setelah membuat undangan. Pilih paket Pro, lakukan pembayaran, dan undangan Anda otomatis berubah menjadi Premium.'
	},
	{
		question: 'Apakah Wedez menyediakan dukungan pelanggan?',
		answer:
			'Ya, Wedez menyediakan dukungan pelanggan melalui chat WhatsApp untuk membantu menjawab pertanyaan atau mengatasi masalah dengan cepat dan responsif.'
	}
] as const;
