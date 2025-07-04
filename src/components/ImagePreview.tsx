import React, {useEffect, useState} from 'react';
import {Box, Text} from 'ink';
import {loadImagePixels, getAnsiBlock, type Pixel} from '../libs/media.js';

interface ImagePreviewProps {
	filePath: string;
	width?: number;
}

/**
 * Preview images in the terminal using ANSI blocks as pixels.
 * This component loads the image, converts it to pixels, and displays it in a "grid" format
 * @param props - properties for the image preview
 */
export const ImagePreview = ({filePath, width = 32}: ImagePreviewProps) => {
	const [pixels, setPixels] = useState<Pixel[][]>([]);

	useEffect(() => {
		loadImagePixels(filePath, width)
			.then(setPixels)
			.catch(err => {
				console.error('Error loading image preview:', err);
			});
	}, [filePath]);

	return (
		<Box flexDirection="column">
			{pixels.map((row, i) => (
				<Box key={i}>
					{row.map((pixel, j) => {
						const block = getAnsiBlock(pixel);
						return block ? (
							<Text key={j}>
								{block}
								{block}
							</Text>
						) : (
							<Text key={j}> </Text>
						);
					})}
				</Box>
			))}
		</Box>
	);
};
