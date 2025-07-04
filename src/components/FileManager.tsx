import React, {useState, useEffect} from 'react';
import {Box, Newline, Text, useInput} from 'ink';
import fs from 'fs';
import path from 'path';
import {exec} from 'child_process';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';
import {Spawn} from 'ink-spawn';
import {
	getFileIcon,
	getFileInfo,
	getDirectoryContent,
	updateReferencesInFileSync,
	IMAGE_EXTENSIONS,
	IMAGE_REGEX,
	VIDEO_EXTENSIONS,
	VIDEO_REGEX,
} from '../libs/files.js';
import {useStdoutDimensions} from '../hooks/useStdoutDimensions.js';
import {
	getFfmpegPath,
	buildImageToWebpArgs,
	buildVideoToMp4Args,
} from '../libs/media.js';
import {Modal} from './Modal.js';
import {ImagePreview} from './ImagePreview.js';

const FileManager = () => {
	const [currentDir, setCurrentDir] = useState(process.cwd());
	const [selected, setSelected] = useState(0);
	const [filterActive, setFilterActive] = useState(false);
	const [filterText, setFilterText] = useState('');
	const [filterApplied, setFilterApplied] = useState('');
	const [scrollOffset, setScrollOffset] = useState(0);
	const [stdoutWidth, stdoutHeight] = useStdoutDimensions();
	const [deleteConfirmActive, setDeleteConfirmActive] = useState(false);
	const [deleteError, setDeleteError] = useState('');
	const [navStack, setNavStack] = useState<{dir: string; selected: number}[]>(
		[],
	);
	const [fileInfo, setFileInfo] = useState('');
	const [convertFile, setConvertFile] = useState<string | null>(null);
	const [targetFile, setTargetFile] = useState<string | null>(null);
	const [replaceInfo, setReplaceInfo] = useState<string | null>(null);
	const [videoPrompt, setVideoPrompt] = useState<{
		file: string | null;
		keepSound: boolean | null;
		active: boolean;
	}>({file: null, keepSound: null, active: false});

	const allFilesInDirectory = getDirectoryContent(currentDir);
	const files = allFilesInDirectory.filter(file => {
		if (!filterApplied) return true;
		return file.toLowerCase().includes(filterApplied.toLowerCase());
	});

	// Calculate how many lines are available for the file list
	const headerLines = 10;
	const footerLines = 3;
	const listHeight = Math.max(1, stdoutHeight - headerLines - footerLines);
	const clampedScrollOffset = Math.min(
		Math.max(scrollOffset, 0),
		Math.max(files.length - listHeight, 0),
	);
	const visibleFiles = files.slice(
		clampedScrollOffset,
		clampedScrollOffset + listHeight,
	);
	const selectedFile = files[selected];
	const selectedPath = selectedFile
		? path.join(currentDir, selectedFile)
		: currentDir;
	const selectedStats = selectedFile ? fs.statSync(selectedPath) : null;

	useEffect(() => {
		let cancelled = false;
		if (selectedFile) {
			getFileInfo(currentDir, selectedFile, targetFile)
				.then(info => {
					if (!cancelled) setFileInfo(info);
				})
				.catch(() => {
					if (!cancelled) setFileInfo('Cannot read file info');
				});
		} else {
			setFileInfo('');
		}
		return () => {
			cancelled = true;
		};
	}, [currentDir, selectedFile]);

	// Ensure "selected" is always in view
	useEffect(() => {
		if (selected < scrollOffset) setScrollOffset(selected);
		else if (selected >= scrollOffset + listHeight)
			setScrollOffset(selected - listHeight + 1);
	}, [selected, listHeight, scrollOffset, currentDir]);

	// Ensure "selected" is clamped within the new files array length when "files" change
	useEffect(() => {
		if (selected >= files.length) {
			setSelected(files.length - 1);
		}
	}, [files.length]);

	useInput((input, key) => {
		if (filterActive) {
			if (key.return) {
				setFilterApplied(filterText);
				setFilterActive(false);
				setSelected(0);
			} else if (key.escape) {
				setFilterText('');
				setFilterApplied('');
				setFilterActive(false);
				setSelected(0);
			} else if (key.backspace || key.delete) {
				setFilterText(text => text.slice(0, -1));
			} else if (input) {
				setFilterText(text => text + input);
			}
			return;
		}

		if (deleteConfirmActive) {
			if (input === 'y' || input === 'Y') {
				try {
					const stats = fs.statSync(selectedPath);
					if (stats.isDirectory()) {
						fs.rmdirSync(selectedPath, {recursive: true});
					} else {
						fs.unlinkSync(selectedPath);
					}
					setDeleteConfirmActive(false);
					setSelected(0);
					setScrollOffset(0);
					setDeleteError('');
				} catch (e) {
					setDeleteError('Failed to delete: ' + e);
					setDeleteConfirmActive(false);
				}
			} else if (input === 'n' || input === 'N' || key.escape) {
				setDeleteConfirmActive(false);
				setDeleteError('');
			}
			return;
		}

		if (videoPrompt.active) {
			if (input === 'y' || input === 'Y') {
				setVideoPrompt({...videoPrompt, keepSound: true, active: false});
			} else if (input === 'n' || input === 'N') {
				setVideoPrompt({...videoPrompt, keepSound: false, active: false});
			} else if (key.escape) {
				setVideoPrompt({file: null, keepSound: null, active: false});
			}
			return;
		}

		if (key.upArrow) setSelected(i => (i > 0 ? i - 1 : i));
		if (key.downArrow) setSelected(i => (i < files.length - 1 ? i + 1 : i));
		if (key.rightArrow && selectedStats?.isDirectory()) {
			setNavStack(stack => [...stack, {dir: currentDir, selected}]);
			setCurrentDir(selectedPath);
			setSelected(0);
			setScrollOffset(0);
		}
		if (key.leftArrow && navStack.length > 0) {
			const last = navStack[navStack.length - 1];
			if (last) {
				setCurrentDir(last.dir);
				setSelected(last.selected);
				setNavStack(stack => stack.slice(0, -1));
			}
		}
		if (input === '/') {
			setFilterActive(true);
			setFilterText('');
		}
		if (input === 'd' && selectedFile) {
			setDeleteConfirmActive(true);
		}
		if (input === 'c' && selectedFile) {
			if (IMAGE_REGEX.test(selectedFile)) {
				setConvertFile(selectedFile);
			} else if (VIDEO_REGEX.test(selectedFile)) {
				setVideoPrompt({file: selectedFile, keepSound: null, active: true});
			}
		}
		if (input === 's' && selectedFile && /\.(html|md)$/i.test(selectedFile)) {
			setTargetFile(path.join(currentDir, selectedFile));
		}
		if (key.escape && filterApplied) {
			setFilterApplied('');
			setSelected(0);
		}
		if (key.return && selectedFile) {
			const fileToOpen = path.join(currentDir, selectedFile);
			let openCmd = '';
			if (process.platform === 'darwin') openCmd = `open "${fileToOpen}"`;
			else if (process.platform === 'win32')
				openCmd = `start "" "${fileToOpen}"`;
			else openCmd = `xdg-open "${fileToOpen}"`;

			exec(openCmd, err => {
				console.log('Cannot open file dawg');
			});
		}
	});

	/**
	 * Updates occurencies of a file in the target file.
	 */
	function updateReferencesInTargetFile({
		filePath,
		newExt,
		extList,
		targetFile,
		setReplaceInfo,
	}: {
		filePath: string;
		newExt: string;
		extList: string[];
		targetFile: string;
		setReplaceInfo: (msg: string) => void;
	}) {
		try {
			const count = updateReferencesInFileSync(
				filePath,
				newExt,
				extList,
				targetFile,
			);
			if (count > 0) {
				setReplaceInfo(
					`Updated ${count} reference${count > 1 ? 's' : ''} in ${path.basename(
						targetFile,
					)}`,
				);
			} else {
				setReplaceInfo(`No references found in ${path.basename(targetFile)}`);
			}
		} catch (err) {
			setReplaceInfo(
				'Error updating target file: ' +
					(err instanceof Error ? err.message : String(err)),
			);
		}
		setTimeout(() => setReplaceInfo(''), 4000);
	}

	const handleImageConversionComplete = async () => {
		if (convertFile && targetFile) {
			updateReferencesInTargetFile({
				filePath: convertFile,
				newExt: '.webp',
				extList: IMAGE_EXTENSIONS,
				targetFile,
				setReplaceInfo,
			});
		}
		setConvertFile(null);
	};

	const handleVideoConversionComplete = () => {
		if (videoPrompt.file && targetFile) {
			updateReferencesInTargetFile({
				filePath: videoPrompt.file,
				newExt: '.mp4',
				extList: VIDEO_EXTENSIONS,
				targetFile,
				setReplaceInfo,
			});
		}
		setVideoPrompt({file: null, keepSound: null, active: false});
	};

	return (
		<Box flexDirection="column" margin={2}>
			{/* Header */}
			<Box justifyContent="space-between" gap={4}>
				{/* Current dir (and filter value) + Filter box */}
				<Box flexDirection="row" gap={4}>
					<Box flexDirection="column">
						<Box>
							<Text bold color="grey">
								Current directory
							</Text>
						</Box>
						<Box width={50}>
							<Text wrap="truncate-start" color="cyan">
								{currentDir}
							</Text>
							{filterApplied && <Text color="yellow"> /{filterApplied}</Text>}
						</Box>
						{filterActive && (
							<Box borderStyle="round" borderColor="green" marginBottom={1}>
								<Text color="green">🔎&nbsp;&gt; {filterText}</Text>
							</Box>
						)}
					</Box>
					{/* Targeted file info */}
					<Box flexDirection="column" marginLeft={2}>
						<Box>
							<Text bold color="grey">
								Targeted file
							</Text>
						</Box>
						<Box width={40}>
							<Text
								wrap="truncate-start"
								color={targetFile ? 'magenta' : 'gray'}
							>
								{targetFile
									? targetFile
									: 'None selected (press s on .html/.md)'}
							</Text>
						</Box>
					</Box>
				</Box>
				{/* Instructions */}
				<Box gap={2}>
					<Box flexDirection="column">
						<Text color="blue">←↑→↓</Text>
						<Text color="blue">{'</>'}</Text>
						<Text color="blue">{'<c>'}</Text>
						<Text color="blue">{'<d>'}</Text>
					</Box>
					<Box flexDirection="column">
						<Text color="grey">Move</Text>
						<Text color="grey">Filter</Text>
						<Text color="grey">Convert</Text>
						<Text color="grey">Delete</Text>
					</Box>
				</Box>
				{/* Logo */}
				<Box marginRight={2} marginTop={-2}>
					<Gradient name="retro">
						<BigText font="block" lineHeight={0} text="N" />
					</Gradient>
				</Box>
			</Box>
			{/* File browser */}
			<Box>
				{/* Left panel : files list */}
				<Box flexDirection="column" marginRight={2} width={50}>
					{visibleFiles.map((file, idx) => {
						const fileIdx = idx + scrollOffset;
						let stats;
						try {
							stats = fs.statSync(path.join(currentDir, file));
						} catch (e) {
							return null;
						}
						const icon = getFileIcon(file, stats);
						return (
							<Text
								key={file}
								color={fileIdx === selected ? 'green' : undefined}
							>
								{fileIdx === selected ? '>' : ' '} {icon} {file}
							</Text>
						);
					})}
					{files.length > listHeight && (
						<Text dimColor>
							{scrollOffset + listHeight < files.length ? '▼' : ''}
							{scrollOffset > 0 ? '▲' : ''}
						</Text>
					)}
				</Box>
				{/* Middle panel : file info */}
				<Box paddingX={1} width={32} height={5} flexDirection="column">
					<Text bold color="light-grey">
						File info
					</Text>
					<Text wrap="truncate-start">{fileInfo}</Text>
				</Box>
				{/* Right panel: file preview */}
				<Box paddingTop={0} marginX={2}>
					{selectedFile && IMAGE_REGEX.test(selectedFile) ? (
						<ImagePreview filePath={selectedPath} />
					) : (
						<Text color="gray">No preview</Text>
					)}
				</Box>
			</Box>
			{/* Modals */}
			{deleteConfirmActive && (
				<Modal width={40} height={5} color={'red'}>
					<Text bold>
						Sure you want to delete
						<Newline />
						<Text color="cyan">"{selectedFile}"</Text> ?
						<Newline />
						<Text color="green">y</Text>/<Text color="red">n</Text>
					</Text>
				</Modal>
			)}
			{convertFile && (
				<Modal width={60} height={10} color={'green'}>
					<Text>Converting {convertFile} to .webp...</Text>
					<Spawn
						command={getFfmpegPath()}
						args={buildImageToWebpArgs(
							path.join(currentDir, convertFile),
							path.join(currentDir, convertFile.replace(/\.[^.]+$/, '.webp')),
						)}
						shell
						onCompletion={handleImageConversionComplete}
					/>
					<Text color="yellow">Press ESC to close</Text>
				</Modal>
			)}
			{videoPrompt.active && videoPrompt.file && (
				<Modal width={50} height={5} color={'blue'}>
					<Text>
						Convert {videoPrompt.file} to mp4.
						<Newline />
						Keep sound? (<Text color="green">y</Text>/<Text color="red">n</Text>
						)
					</Text>
				</Modal>
			)}
			{videoPrompt.file && videoPrompt.keepSound !== null && (
				<Modal width={60} height={10} color={'green'}>
					<Text>Converting {videoPrompt.file} to .mp4...</Text>
					<Spawn
						command={getFfmpegPath()}
						args={buildVideoToMp4Args(
							path.join(currentDir, videoPrompt.file),
							path.join(
								currentDir,
								videoPrompt.file.replace(/\.[^.]+$/, '.mp4'),
							),
							videoPrompt.keepSound,
						)}
						shell
						onCompletion={handleVideoConversionComplete}
					/>
					<Text color="yellow">Press ESC to close</Text>
				</Modal>
			)}
			{/* Footer messages */}
			{deleteError && (
				<Box>
					<Text color="red">{deleteError}</Text>
				</Box>
			)}
			{replaceInfo && (
				<Box marginTop={1}>
					<Text color="magenta">{replaceInfo}</Text>
				</Box>
			)}
		</Box>
	);
};

export default FileManager;
