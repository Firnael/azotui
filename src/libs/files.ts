import fs from 'fs';
import path from 'path';
import {getImageDimensions, getVideoDuration} from './media.js';
import {logDebug} from './debug.js';

export const IMAGE_EXTENSIONS = [
	'png',
	'jpg',
	'jpeg',
	'gif',
	'bmp',
	'svg',
	'webp',
	'avif',
];
export const IMAGE_REGEX = new RegExp(
	`\\.(${IMAGE_EXTENSIONS.join('|')})$`,
	'i',
);
export const VIDEO_EXTENSIONS = ['mp4', 'avi', 'mov', 'mkv', 'webm'];
export const VIDEO_REGEX = new RegExp(
	`\\.(${VIDEO_EXTENSIONS.join('|')})$`,
	'i',
);

export const getDirectoryContent = (dir: string) => fs.readdirSync(dir);

export const getFileIcon = (filename: string, stats: fs.Stats) => {
	let icon = '📃';
	if (stats.isDirectory()) icon = '📁';

	const ext = path.extname(filename).toLowerCase();
	if (IMAGE_REGEX.test(ext)) icon = '📒';
	if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) icon = '🎬';
	if (['.mp3', '.wav', '.flac', '.aac', '.ogg'].includes(ext)) icon = '🎵';
	if (['.txt', '.md', '.json'].includes(ext)) icon = '📝';
	if (['.js', '.ts', '.tsx', '.html', '.css'].includes(ext)) icon = '📄';
	if (['.zip', '.rar'].includes(ext)) icon = '📦';
	return icon;
};

/**
 * Count occurrences of a file name (without extension) in a target file.
 * This is useful to know how many times a file is referenced in the target file, so you don't delete it by mistake.
 * @param targetFilePath
 * @param fileNameNoExt
 * @param extList
 */
export function countFileOccurrences(
	targetFilePath: string,
	fileNameNoExt: string,
	extList: string[],
): number {
	try {
		const content = fs.readFileSync(targetFilePath, 'utf8');
		const regex = new RegExp(
			`${fileNameNoExt}\\.(?:${extList.join('|')})`,
			'gi',
		);
		return (content.match(regex) || []).length;
	} catch {
		logDebug(`Error during 'countFileOccurrences' on file : ${targetFilePath}`);
		return 0;
	}
}

export const getFileInfo = async (
	dir: string,
	filename: string,
	targetFilePath?: string,
): Promise<string> => {
	const filePath = path.join(dir, filename);
	const stats = fs.statSync(filePath);
	const nameLine = `${filename}`;

	if (stats.isDirectory()) {
		const {folders, files, size} = getFolderInfo(filePath);
		return `${nameLine}\n${folders} folder${
			folders !== 1 ? 's' : ''
		}, ${files} file${files !== 1 ? 's' : ''}\nTotal size: ${formatSize(size)}`;
	}

	if (IMAGE_REGEX.test(filename)) {
		const dimensions = await getImageDimensions(filePath);
		let info = `${nameLine}\nSize: ${formatSize(stats.size)}\nDimensions: ${
			dimensions.width
		}x${dimensions.height}`;
		if (targetFilePath) {
			const fileNameNoExt = path.basename(filename).replace(/\.[^.]+$/, '');
			const count = countFileOccurrences(
				targetFilePath,
				fileNameNoExt,
				IMAGE_EXTENSIONS,
			);
			info += `\nOccurrences in target: ${count}`;
		}
		return info;
	}

	if (VIDEO_REGEX.test(filename)) {
		const duration = await getVideoDuration(filePath);
		let info = `${nameLine}\nSize: ${formatSize(
			stats.size,
		)}\nDuration: ${duration.toFixed(1)} sec`;
		if (targetFilePath) {
			const fileNameNoExt = path.basename(filename).replace(/\.[^.]+$/, '');
			const count = countFileOccurrences(
				targetFilePath,
				fileNameNoExt,
				VIDEO_EXTENSIONS,
			);
			info += `\nOccurrences in target: ${count}`;
		}
		return info;
	}

	return `${nameLine}\nSize: ${formatSize(stats.size)}`;
};

/**
 * Helper to get folder content info (ex. : number of files, folders and total size).
 * (non-recursive to save performance and because I suck at recursion optimization)
 */
export function getFolderInfo(dirPath: string): {
	folders: number;
	files: number;
	size: number;
} {
	let folders = 0;
	let files = 0;
	let size = 0;
	const items = fs.readdirSync(dirPath);
	for (const item of items) {
		const itemPath = path.join(dirPath, item);
		const stats = fs.statSync(itemPath);
		if (stats.isDirectory()) {
			folders += 1;
			size += stats.size; // folder size should be 0, but keep for consistency
		} else {
			files += 1;
			size += stats.size;
		}
	}
	return {folders, files, size};
}

/**
 * Update all references to a file in the target file, replacing the extension.
 * Returns the number of replacements made.
 * ⚠️ This function modifies the target file directly, also this is synchronous 💩
 */
export function updateReferencesInFileSync(
	filePath: string,
	newExt: string,
	extList: string[],
	targetFilePath: string,
): number {
	const fileName = path.basename(filePath);
	const fileNameNoExt = fileName.replace(/\.[^.]+$/, '');
	const targetContent = fs.readFileSync(targetFilePath, 'utf8');
	const regex = new RegExp(
		`((?:["'\\(=]\s*[^"'\\(\\)\s>]*?)${fileNameNoExt})(?:\\.(${extList.join(
			'|',
		)}))`,
		'gi',
	);
	let count = 0;
	const replaced = targetContent.replace(regex, (match, prefix) => {
		if (!prefix) return match;
		count++;
		return prefix + newExt;
	});
	if (count > 0) {
		fs.writeFileSync(targetFilePath, replaced, 'utf8');
	}
	return count;
}

/**
 * Format a size in bytes to a human-readable string.
 * @param size - Size in bytes
 * @returns the formatted size string
 */
function formatSize(size: number): string {
	if (size < 1024) return `${size} B`;
	if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
	return `${(size / (1024 * 1024)).toFixed(2)} MB`;
}
