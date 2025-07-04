import React, {ReactNode} from 'react';
import {Box} from 'ink';
import {useStdoutDimensions} from '../hooks/useStdoutDimensions.js';

interface ModalProps {
	children: ReactNode;
	width?: number;
	height?: number;
	color?: string;
}

/**
 * Display a modal dialog in the terminal.
 * This component centers the modal in the terminal window and applies a border style.
 * (this is kinda broken when stuff is drawn behind it)
 * @param props - properties for the modal
 */
export const Modal = ({
	children,
	width = 40,
	height = 10,
	color = 'red',
}: ModalProps) => {
	const [stdoutWidth, stdoutHeight] = useStdoutDimensions();
	const horizontalMargin = Math.max(0, Math.floor((stdoutWidth - width) / 2));
	const verticalMargin = Math.max(
		0,
		Math.floor((stdoutHeight - height) / 2) - height * 2,
	);

	return (
		<Box
			position="absolute"
			flexDirection="column"
			width={width}
			height={height}
			marginTop={verticalMargin}
			marginLeft={horizontalMargin}
			borderStyle="round"
			borderColor={color}
			alignItems="center"
			justifyContent="center"
		>
			{children}
		</Box>
	);
};
