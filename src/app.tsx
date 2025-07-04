import React, {useState, useEffect} from 'react';
import { Box, useInput } from 'ink';
import Banner from './components/Banner.js';
import FileManager from './components/FileManager.js';
import { useStdoutDimensions } from './hooks/useStdoutDimensions.js';
import pkg from '../package.json' with { type: 'json' };

const App = () => {
	const [stdoutWidth, stdoutHeight] = useStdoutDimensions();
	const [showBanner, setShowBanner] = useState(true);

	useEffect(() => {
		const timer = setTimeout(() => setShowBanner(false), 1500);
		return () => clearTimeout(timer);
	}, []);

	useInput(() => {

	});

	if (showBanner) {
		return <Banner version={pkg.version} />;
	} else {
		return (
			<Box width={stdoutWidth} height={stdoutHeight} flexDirection="column">
				<FileManager />
			</Box>
		);
	}
};

export default App;
