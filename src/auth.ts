import crypto from 'crypto';
import net from 'net';

export async function authenticate(
    socket: net.Socket,
    challenge: string,
    password: string
): Promise<boolean> {
    const hash = crypto
    .createHash('sha256')
    .update(challenge + password)
    .digest('hex');

    socket.write(hash + '\r\n');

    const result = await new Promise<string>((resolve) => {
        const handler = (data: Buffer) => {
            socket.off('data', handler);
            resolve(data.toString('ascii').trim());
        };
        socket.on('data', handler);
    });

    return result === 'OK';
}