import net from 'net';
import { formatCommand, parseResponse } from './protocol';
import { authenticate } from './auth';
import { PowerState, PowerStatus, ErrorStatus, WarningStatus } from './types';

export class ADCPClient {
    private socket!: net.Socket;
    private buffer = '';
    private connected = false;

    constructor(
        private host: string,
        private port: number = 53595,
        private password?: string
    ) {}

    async connect(): Promise<void> {
        this.socket = net.createConnection(this.port, this.host);

        await new Promise<void>((resolve, reject) => {
            this.socket.once('connect', resolve);
            this.socket.once('error', reject);
        });

        const challenge = await this.readLine();

        if (challenge !== 'NOKEY' && this.password) {
            const ok = await authenticate(this.socket, challenge, this.password);
            if (!ok) throw new Error('Authentication failed');
        }

        this.connected = true;
    }

    close() {
        this.socket?.end();
        this.connected = false;
    }

    // ------------------- Internal Methods ------------------- //

    private async send(cmd: string): Promise<any> {
        if (!this.connected) throw new Error('Not connected');

        this.socket.write(formatCommand(cmd));
        const response = await this.readLine();
        return parseResponse(response);
    }

    private async readLine(): Promise<string> {
        return new Promise<string>((resolve) => {
            const handler = (data: Buffer) => {
                this.buffer += data.toString('ascii');
                const index = this.buffer.indexOf('\r\n');
                if (index !== -1) {
                    const line = this.buffer.slice(0, index);
                    this.buffer = this.buffer.slice(index + 2);
                    this.socket.off('data', handler);
                    resolve(line);
                }
            };
            this.socket.on('data', handler);
        });
    }

    // ------------------- Public API Methods ------------------- //

    async setPower(state: PowerState): Promise<true> {
        await this.send(`power "${state}"`);
        return true;
    }

    async getPowerStatus(): Promise<PowerStatus> {
        const r = await this.send(`power_status ?`);
        return { state: r?.status ?? r };
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
        return String(await this.send(`modelname ?`));
    }

    async getSerialNumber(): Promise<string> {
        return String(await this.send(`serialnum ?`));
    }
}