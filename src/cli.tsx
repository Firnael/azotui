#!/usr/bin/env node
import React from 'react';
import {render} from 'ink';
import meow from 'meow';
import App from './app.js';

// Switch to alternate screen (isolate the app in own screen like K9S)
process.stdout.write('\x1b[?1049h');

const cli = meow(
	`
	Usage
	  $ azotui

	Options
		--todo  Do something with args

	Examples
	  $ azotui --todo=dance
`,
	{
		importMeta: import.meta,
		flags: {
			todo: {
				type: 'string',
			},
		},
	},
);

render(<App />);
