import fs from 'fs';
import path from 'path';

const debugLogPath = path.join(process.cwd(), 'debug.log');

/**
 * Log stuff in a file for debugging purposes (no shit)
 * @param data - the stuff to log
 */
export function logDebug(data: any) {
	try {
		const text =
			typeof data === 'string' ? data : JSON.stringify(data, null, 2);
		fs.appendFileSync(debugLogPath, `[${new Date().toISOString()}] ${text}\n`);
	} catch (err) {
		// fail silently,  we don't want a crash from debugging
		// good luck to understand the error tho
	}
}
