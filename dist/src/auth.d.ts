import net from 'net';
import { Logger } from './types';
export declare function authenticate(socket: net.Socket, challenge: string, password: string, logger?: Logger): Promise<boolean>;
