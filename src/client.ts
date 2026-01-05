import net from 'net';
import { formatCommand, parseResponse } from './protocol';
import { authenticate } from './auth';
import { PowerState, PowerStatus, ErrorStatus, WarningStatus, Logger } from './types';

export class ADCPClient {
    private socket!: net.Socket;
    private buffer = '';
    private connected = false;

    private logger?: Logger;

    constructor(
        private host: string,
        private port: number = 53595,
        private password?: string,
        logger?: Logger
    ) {
        this.logger = logger;
    }

    private dbg(...args: any[]) {
        if (this.logger?.debug) {
            this.logger.debug(...args);
        }
    }

    private setupSocketHandlers(): void {
        this.socket.on('error', (err) => {
            this.dbg('[ADCP][client] socket error event', err);
            this.connected = false;
        });

        this.socket.on('close', () => {
            this.dbg('[ADCP][client] socket closed');
            this.connected = false;
        });
    }

    async connect(): Promise<void> {
        this.dbg('[ADCP][client] connect ->', { host: this.host, port: this.port });
        this.socket = net.createConnection(this.port, this.host);

        await new Promise<void>((resolve, reject) => {
            this.socket.once('connect', () => {
                this.dbg('[ADCP][client] socket connected');
                this.setupSocketHandlers();
                resolve();
            });
            this.socket.once('error', (err) => {
                this.dbg('[ADCP][client] socket error during connect', err);
                reject(err);
            });
        });

        const challenge = await this.readLine();
        this.dbg('[ADCP][client] server challenge:', challenge);

        if (challenge !== 'NOKEY' && this.password) {
            this.dbg('[ADCP][client] attempting authenticate');
            const ok = await authenticate(this.socket, challenge, this.password, this.logger);
            this.dbg('[ADCP][client] authenticate ok=', ok);
            if (!ok) throw new Error('Authentication failed');
        }

        this.connected = true;
        this.dbg('[ADCP][client] connected=true');
    }

    close() {
        this.dbg('[ADCP][client] close called');
        this.socket?.end();
        this.connected = false;
    }

    // ------------------- Internal Methods ------------------- //

    private async send(cmd: string): Promise<any> {
        if (!this.connected) {
            throw new Error('Not connected. Call connect() first or connection was lost.');
        }

        try {
            const out = formatCommand(cmd, this.logger);
            this.dbg('[ADCP][client] send ->', { cmd, out });
            this.socket.write(out);
            const response = await this.readLine();
            this.dbg('[ADCP][client] send <- raw response', response);
            const parsed = parseResponse(response, this.logger);
            this.dbg('[ADCP][client] send <- parsed response', parsed);
            return parsed;
        } catch (err) {
            this.connected = false;
            this.dbg('[ADCP][client] send error, marking disconnected', err);
            throw err;
        }
    }

    private async readLine(timeoutMs: number = 5000): Promise<string> {
        return new Promise<string>((resolve, reject) => {
            let timeoutId: NodeJS.Timeout | null = null;

            const cleanup = () => {
                if (timeoutId) clearTimeout(timeoutId);
                this.socket.off('data', handler);
                this.socket.off('close', closeHandler);
            };

            const handler = (data: Buffer) => {
                this.dbg('[ADCP][client] readLine got chunk', data.toString('ascii'));
                this.buffer += data.toString('ascii');
                const index = this.buffer.indexOf('\r\n');
                if (index !== -1) {
                    const line = this.buffer.slice(0, index);
                    this.buffer = this.buffer.slice(index + 2);
                    cleanup();
                    this.dbg('[ADCP][client] readLine ->', line);
                    resolve(line);
                }
            };

            const closeHandler = () => {
                cleanup();
                reject(new Error('Socket closed while waiting for response'));
            };

            timeoutId = setTimeout(() => {
                cleanup();
                reject(new Error(`readLine timeout after ${timeoutMs}ms`));
            }, timeoutMs);

            this.socket.on('data', handler);
            this.socket.once('close', closeHandler);
        });
    }

    // ------------------- Public API Methods ------------------- //

    async setPower(state: PowerState): Promise<true> {
        this.dbg('[ADCP][client] setPower ->', state);
        await this.send(`power "${state}"`);
        this.dbg('[ADCP][client] setPower done');
        return true;
    }

    async getPowerStatus(): Promise<PowerStatus> {
        this.dbg('[ADCP][client] getPowerStatus');
        const r = await this.send(`power_status ?`);
        const state = r?.status ?? r;
        this.dbg('[ADCP][client] getPowerStatus <-', state);
        return { state };
    }

    async getErrors(): Promise<ErrorStatus> {
        const r = await this.send(`error ?`);
        let status: any = r?.status ?? r;
        if (Array.isArray(status)) status = status[0];
        if (!status || status === 'no_err') return { hasError: false };
        return { hasError: true, code: String(status) };
    }

    async getWarnings(): Promise<WarningStatus> {
        const r = await this.send(`warning ?`);
        let status: any = r?.status ?? r;
        if (Array.isArray(status)) status = status[0];
        if (!status || status === 'no_warn') return { hasWarning: false };
        return { hasWarning: true, code: String(status) };
    }

    async getModelName(): Promise<string> {
        this.dbg('[ADCP][client] getModelName');
        const r = await this.send(`modelname ?`);
        this.dbg('[ADCP][client] getModelName <-', r);
        return String(r);
    }

    async getSerialNumber(): Promise<string> {
        this.dbg('[ADCP][client] getSerialNumber');
        const r = await this.send(`serialnum ?`);
        this.dbg('[ADCP][client] getSerialNumber <-', r);
        return String(r);
    }
}