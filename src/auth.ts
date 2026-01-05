import crypto from 'crypto';
import net from 'net';
import { Logger } from './types';

export async function authenticate(
    socket: net.Socket,
    challenge: string,
    password: string,
    logger?: Logger
): Promise<boolean> {
    if (logger?.debug) {
        logger.debug('[ADCP][auth] authenticate start', { challenge });
    }
    const hash = crypto
        .createHash('sha256')
        .update(challenge + password)
        .digest('hex');

    if (logger?.debug) {
        logger.debug('[ADCP][auth] sending hash', { hashSnippet: hash.slice(0, 8) });
    }
    socket.write(hash + '\r\n');

    const result = await new Promise<string>((resolve) => {
        const handler = (data: Buffer) => {
            socket.off('data', handler);
            const txt = data.toString('ascii').trim();
            if (logger?.debug) {
                logger.debug('[ADCP][auth] auth response raw:', txt);
            }
            resolve(txt);
        };
        socket.on('data', handler);
    });

    const ok = result === 'OK';
    if (logger?.debug) {
        logger.debug('[ADCP][auth] authenticate result:', ok);
    }
    return ok;
}