export const OPTIMIZABLE_IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp';

const SUPPORTED_IMAGE_TYPES = new Set(OPTIMIZABLE_IMAGE_ACCEPT.split(','));
const WEBP_TYPE = 'image/webp';

export type ImageOptimizationOptions = {
	maxHeight: number;
	maxWidth: number;
	quality: number;
};

export class ImageOptimizationError extends Error {
	constructor(message: string, options?: ErrorOptions) {
		super(message, options);
		this.name = 'ImageOptimizationError';
	}
}

type DecodedImage = {
	cleanup: () => void;
	height: number;
	source: CanvasImageSource;
	width: number;
};

async function decodeImage(file: File): Promise<DecodedImage> {
	if (typeof createImageBitmap === 'function') {
		const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });

		return {
			cleanup: () => bitmap.close(),
			height: bitmap.height,
			source: bitmap,
			width: bitmap.width
		};
	}

	const url = URL.createObjectURL(file);
	const image = new Image();
	image.src = url;

	try {
		await image.decode();

		return {
			cleanup: () => URL.revokeObjectURL(url),
			height: image.naturalHeight,
			source: image,
			width: image.naturalWidth
		};
	} catch (error) {
		URL.revokeObjectURL(url);
		throw error;
	}
}

function canvasToWebp(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => {
				if (!blob || blob.type !== WEBP_TYPE) {
					reject(
						new ImageOptimizationError('Browser ini belum mendukung optimasi gambar ke WebP.')
					);
					return;
				}

				resolve(blob);
			},
			WEBP_TYPE,
			quality
		);
	});
}

function toWebpFilename(filename: string): string {
	const extensionIndex = filename.lastIndexOf('.');
	const basename = (extensionIndex > 0 ? filename.slice(0, extensionIndex) : filename).trim();

	return `${basename || 'image'}.webp`;
}

export async function optimizeImage(file: File, options: ImageOptimizationOptions): Promise<File> {
	if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
		throw new ImageOptimizationError('Format gambar tidak didukung. Gunakan JPEG, PNG, atau WebP.');
	}

	let decodedImage: DecodedImage;

	try {
		decodedImage = await decodeImage(file);
	} catch (error) {
		throw new ImageOptimizationError('File gambar tidak dapat dibaca.', { cause: error });
	}

	try {
		if (decodedImage.width < 1 || decodedImage.height < 1) {
			throw new ImageOptimizationError('Ukuran gambar tidak valid.');
		}

		const scale = Math.min(
			1,
			options.maxWidth / decodedImage.width,
			options.maxHeight / decodedImage.height
		);
		const outputWidth = Math.max(1, Math.round(decodedImage.width * scale));
		const outputHeight = Math.max(1, Math.round(decodedImage.height * scale));
		const canvas = document.createElement('canvas');
		canvas.width = outputWidth;
		canvas.height = outputHeight;

		const context = canvas.getContext('2d');
		if (!context) {
			throw new ImageOptimizationError('Gambar gagal diproses oleh browser.');
		}

		context.imageSmoothingEnabled = true;
		context.imageSmoothingQuality = 'high';
		context.drawImage(decodedImage.source, 0, 0, outputWidth, outputHeight);

		const webp = await canvasToWebp(canvas, options.quality);

		if (file.type === WEBP_TYPE && scale === 1 && webp.size >= file.size) {
			return file;
		}

		return new File([webp], toWebpFilename(file.name), {
			lastModified: Date.now(),
			type: WEBP_TYPE
		});
	} finally {
		decodedImage.cleanup();
	}
}
