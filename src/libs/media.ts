import sharp from 'sharp';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegPath from 'ffmpeg-static';
import ffprobePath from 'ffprobe-static';

ffmpeg.setFfmpegPath(ffmpegPath);
ffmpeg.setFfprobePath(ffprobePath.path);

export function getFfmpegPath(): string {
	return ffmpegPath as unknown as string;
}

export type Pixel = {r: number; g: number; b: number; a?: number};
export const DEFAULT_COLOR = 16;

export const getAnsiBlock = (pixel: Pixel) => {
	if (pixel.a !== undefined && pixel.a === 0) return '';
	return `\x1b[38;2;${pixel.r};${pixel.g};${pixel.b}m█\x1b[0m`;
};

/**
 * Load and process image pixels using sharp.
 * @param filePath Path to the image file
 * @param width Width (and height) to resize to
 * @returns 2D array of RGBA pixels
 */
export async function loadImagePixels(
	filePath: string,
	width: number,
): Promise<Pixel[][]> {
	const height = width; // keep square ratio

	const {data, info} = await sharp(filePath)
		.resize(width, height, {fit: 'contain'})
		.raw()
		.toBuffer({resolveWithObject: true});

	const channels = info.channels; // 3 (RGB) or 4 (RGBA)
	const pixels: Pixel[][] = [];

	for (let y = 0; y < height; y++) {
		const row: Pixel[] = [];
		for (let x = 0; x < width; x++) {
			const idx = (y * width + x) * channels;
			const a = channels === 4 ? data[idx + 3]! / 255 : 1;
			const r = Math.round((data[idx] ?? DEFAULT_COLOR) * a);
			const g = Math.round((data[idx + 1] ?? DEFAULT_COLOR) * a);
			const b = Math.round((data[idx + 2] ?? DEFAULT_COLOR) * a);
			row.push({r, g, b, a});
		}
		pixels.push(row);
	}

	return pixels;
}

/**
 * Get image dimensions using sharp
 * @param filePath to the image file
 * @returns the image dimensions
 */
export async function getImageDimensions(
	filePath: string,
): Promise<{width: number; height: number}> {
	try {
		const metadata = await sharp(filePath).metadata();
		return {width: metadata.width, height: metadata.height};
	} catch (err) {
		console.error('Failed to get image dimensions:', err);
		return {width: 0, height: 0};
	}
}

/**
 * Retrieve video duration using ffprobe
 * @param filePath the video file path
 * @returns the duration in seconds as a Promise
 */
export function getVideoDuration(filePath: string): Promise<number> {
	return new Promise((resolve, reject) => {
		ffmpeg.ffprobe(filePath, (err, metadata) => {
			if (err) return resolve(0);
			resolve(metadata.format.duration ?? 0);
		});
	});
}

/**
 * Build arguments for converting an image to WebP format using ffmpeg
 * @param inputPath path to the input image file
 * @param outputPath path to the output WebP file
 * @returns the arguments array for ffmpeg
 */
export function buildImageToWebpArgs(
	inputPath: string,
	outputPath: string,
): string[] {
	return ['-y', '-i', inputPath, outputPath];
}

/**
 * Build arguments for converting a video to MP4 format using ffmpeg
 * @param inputPath path to the input video file
 * @param outputPath path to the output MP4 file
 * @returns the arguments array for ffmpeg
 */
export function buildVideoToMp4Args(
	inputPath: string,
	outputPath: string,
	keepSound: boolean,
): string[] {
	return [
		'-y',
		'-i',
		inputPath,
		'-c:v',
		'libx264',
		'-preset',
		'veryslow',
		'-crf',
		'20',
		...(keepSound ? ['-c:a', 'aac', '-b:a', '128k'] : ['-an']),
		outputPath,
	];
}
