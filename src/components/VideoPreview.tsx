// import ffmpegPath from 'ffmpeg-static';
// import { spawn } from 'child_process';
// import sharp from 'sharp';

// async function extractFirstFrameBuffer(videoPath) {
// 	return new Promise((resolve, reject) => {
// 		const ffmpeg = spawn(ffmpegPath, [
// 			'-i', videoPath,
// 			'-vf', 'select=eq(n\\,0)',
// 			'-vframes', '1',
// 			'-f', 'image2pipe',
// 			'-vcodec', 'mjpeg',
// 			'-'
// 		]);

// 		const chunks = [];
// 		ffmpeg.stdout.on('data', chunk => chunks.push(chunk));
// 		ffmpeg.stderr.on('data', () => {}); // suppress ffmpeg logs

// 		ffmpeg.on('close', code => {
// 			if (code === 0) {
// 				resolve(Buffer.concat(chunks));
// 			} else {
// 				reject(new Error('ffmpeg failed'));
// 			}
// 		});
// 	});
// }

// import React, { useEffect, useState } from 'react';
// import { Box, Text } from 'ink';
// import sharp from 'sharp';

// const width = 40;
// const height = 40;

// const VideoPreview = ({ filePath }) => {
// 	const [pixels, setPixels] = useState<Pixel[][]>([]);

// 	useEffect(() => {
// 		const loadFrame = async () => {
// 			try {
// 				const buffer = await extractFirstFrameBuffer(filePath);
// 				const { data, info } = await sharp(buffer)
// 					.resize(width, height, { fit: 'contain' })
// 					.raw()
// 					.toBuffer({ resolveWithObject: true });

// 				const channels = info.channels;
// 				const pixelRows = [];
// 				for (let y = 0; y < height; y++) {
// 					const row = [];
// 					for (let x = 0; x < width; x++) {
// 						const idx = (y * width + x) * channels;
// 						const a = channels === 4 ? data[idx + 3] / 255 : 1;
// 						const r = Math.round((data[idx] || 0) * a);
// 						const g = Math.round((data[idx + 1] || 0) * a);
// 						const b = Math.round((data[idx + 2] || 0) * a);
// 						row.push({ r, g, b });
// 					}
// 					pixelRows.push(row);
// 				}
// 				setPixels(pixelRows);
// 			} catch (err) {
// 				console.error('Error loading video frame:', err);
// 			}
// 		};
// 		loadFrame();
// 	}, [filePath]);

// 	return (
// 		<Box flexDirection="column">
// 			{pixels.map((row, i) => (
// 				<Box key={i}>
// 					{row.map((pixel, j) => (
// 						<Text key={j}>
//                        // TODO
// 						</Text>
// 					))}
// 				</Box>
// 			))}
// 		</Box>
// 	);
// };
