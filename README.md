# ADCP TypeScript Client

A TypeScript client for communicating with ADCP (Advanced Device Control Protocol) devices.

## Installation

```bash
npm install adcp-ts
```

## Usage

### Basic Connection

```typescript
import { ADCPClient } from 'adcp-ts';

const client = new ADCPClient('192.168.40.57', 53595, 'password');

await client.connect();
const model = await client.getModelName();
console.log('Model:', model);
await client.close();
```

### Environment Variables

The client can read configuration from environment variables:

```bash
ADCP_IP=192.168.40.57 ADCP_PORT=53595 ADCP_PASSWORD=mypassword node app.js
```

```typescript
const host = process.env.ADCP_IP || '192.168.40.57';
const port = parseInt(process.env.ADCP_PORT || '53595', 10);
const password = process.env.ADCP_PASSWORD || '';

const client = new ADCPClient(host, port, password);
```

### Custom Logger

Provide a custom logger implementing the `Logger` interface to capture debug output:

```typescript
import { ADCPClient, Logger } from 'adcp-ts';

const myLogger: Logger = {
    debug: (...args) => console.debug('[ADCP]', ...args),
    info: (...args) => console.info('[ADCP]', ...args),
    warn: (...args) => console.warn('[ADCP]', ...args),
    error: (...args) => console.error('[ADCP]', ...args),
};

const client = new ADCPClient(host, port, password, myLogger);
```

### API Methods

- `connect(): Promise<void>` — Connect to the device
- `close(): void` — Close the connection
- `getModelName(): Promise<string>` — Get device model name
- `getSerialNumber(): Promise<string>` — Get device serial number
- `getPowerStatus(): Promise<PowerStatus>` — Get power status
- `setPower(state: 'on' | 'off'): Promise<true>` — Set power state
- `getErrors(): Promise<ErrorStatus>` — Get error status
- `getWarnings(): Promise<WarningStatus>` — Get warning status

### Example with Logger

```typescript
import { ADCPClient } from 'adcp-ts';

const client = new ADCPClient(
    '192.168.40.57',
    53595,
    'password',
    {
        debug: (msg) => console.log('[DEBUG]', msg),
    }
);

try {
    await client.connect();
    console.log('Model:', await client.getModelName());
    console.log('Power:', await client.getPowerStatus());
} catch (err) {
    console.error('Error:', err);
} finally {
    await client.close();
}
```

## Types

```typescript
interface Logger {
    debug?(...args: any[]): void;
    info?(...args: any[]): void;
    warn?(...args: any[]): void;
    error?(...args: any[]): void;
}

interface PowerStatus {
    state: 'on' | 'off' | 'warming' | 'cooling' | 'standby';
}

interface ErrorStatus {
    hasError: boolean;
    code?: string;
}

interface WarningStatus {
    hasWarning: boolean;
    code?: string;
}
```
