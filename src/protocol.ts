import { Logger } from './types';

export function formatCommand(cmd: string, logger?: Logger): string {
    const out = cmd.endsWith('\r\n') ? cmd : cmd + '\r\n';
    if (logger?.debug) {
        logger.debug('[ADCP][protocol] formatCommand ->', { in: cmd, out });
    }
    return out;
}

export function parseResponse(response: string, logger?: Logger): any {
    if (logger?.debug) {
        logger.debug('[ADCP][protocol] parseResponse <-', response);
    }
    if (response === 'ok') return true;
    if (response.startsWith('err')) {
        if (logger?.debug) {
            logger.debug('[ADCP][protocol] parseResponse -> throwing error', response);
        }
        throw new Error(response);
    }

    try {
        const parsed = JSON.parse(response);
        if (logger?.debug) {
            logger.debug('[ADCP][protocol] parseResponse -> parsed', parsed);
        }
        return parsed;
    } catch {
        if (logger?.debug) {
            logger.debug('[ADCP][protocol] parseResponse -> raw', response);
        }
        return response;
    }
}