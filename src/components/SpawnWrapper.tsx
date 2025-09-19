import React, {useEffect} from 'react';
import {Text, Box} from 'ink';
import {spawn} from 'child_process';
import {logDebug} from '../libs/debug.js';

type Props = {
	command: string;
	args?: string[];
	shell?: boolean;
	runningText?: string;
	successText?: string;
	failureText?: string;
	onCompletion?: (err?: any) => void;
};

export const SpawnWrapper: React.FC<Props> = ({
	command,
	args = [],
	shell = false, // false by default, we'll see later if we need to pass args
	runningText,
	successText,
	failureText,
	onCompletion,
}) => {
	useEffect(() => {
		let completed = false;
		logDebug({event: 'spawn-start', command, args, shell});
		const proc = spawn(command, args, {shell});

		proc.stdout.on('data', data => {
			logDebug({event: 'spawn-stdout', command, data: String(data)});
		});

		proc.stderr.on('data', data => {
			logDebug({event: 'spawn-stderr', command, data: String(data)});
		});

		proc.on('error', err => {
			logDebug({event: 'spawn-error', command, err: String(err)});
			if (!completed) {
				completed = true;
				onCompletion?.(err);
			}
		});

		proc.on('close', code => {
			logDebug({event: 'spawn-close', command, code});
			if (!completed) {
				completed = true;
				if (code === 0) onCompletion?.();
				else onCompletion?.(new Error(`Process exited with code ${code}`));
			}
		});

		return () => {
			try {
				proc.kill();
			} catch (e) {
				/* ignore */
			}
		};
	}, [command, JSON.stringify(args), shell]);

	return (
		<Box>
			<Text>{runningText ?? ''}</Text>
		</Box>
	);
};

export default SpawnWrapper;
