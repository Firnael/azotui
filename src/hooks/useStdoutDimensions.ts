import {useState, useEffect} from 'react';

/**
 * Hook the window resizing to get the current dimensions of the stdout.
 * Useful to adapt the UI to the terminal size (don't push your luck with very small terminals).
 */
export function useStdoutDimensions(): [number, number] {
	const [dimensions, setDimensions] = useState<[number, number]>([
		process.stdout.columns ?? 80,
		process.stdout.rows ?? 24,
	]);

	useEffect(() => {
		const handler = () =>
			setDimensions([process.stdout.columns ?? 80, process.stdout.rows ?? 24]);

		process.stdout.on('resize', handler);

		return () => {
			process.stdout.off('resize', handler);
		};
	}, []);

	return dimensions;
}
