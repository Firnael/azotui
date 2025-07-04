import React from 'react';
import {Box, Newline, Text} from 'ink';
import Gradient from 'ink-gradient';
import BigText from 'ink-big-text';

/**
 * Kick-ass banner, as a famous person once said :
 * "if your project has no banner, why did you start a project at all"
 * @param props - stuff you want to display in the banner
 */
const Banner = ({version}: {version: string}) => {
	return (
		<Box alignSelf="center" justifyContent="center" flexDirection="column">
			<Gradient name="retro">
				<BigText letterSpacing={7} text="N" font="block" />
				<BigText font="tiny" text="AzotUI" />
				<Newline />
				<Text>Azsets Optimizer TUI</Text>
				<Newline />
				<Text>v{version}</Text>
			</Gradient>
		</Box>
	);
};

export default Banner;
