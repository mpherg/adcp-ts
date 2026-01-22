import { PowerState, PowerStatus, ErrorStatus, WarningStatus, Logger } from './types';
export declare class ADCPClient {
    private host;
    private port;
    private password?;
    private socket;
    private buffer;
    private connected;
    private logger?;
    constructor(host: string, port?: number, password?: string | undefined, logger?: Logger);
    private dbg;
    private setupSocketHandlers;
    connect(): Promise<void>;
    close(): void;
    private send;
    private readLine;
    setPower(state: PowerState): Promise<true>;
    getPowerStatus(): Promise<PowerStatus>;
    getErrors(): Promise<ErrorStatus>;
    getWarnings(): Promise<WarningStatus>;
    getModelName(): Promise<string>;
    getSerialNumber(): Promise<string>;
}
