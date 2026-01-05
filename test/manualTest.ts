import { ADCPClient } from "../src";

async function main() {
    const host = process.env.ADCP_IP || '192.168.40.57';
    const port = process.env.ADCP_PORT ? Number(process.env.ADCP_PORT) : 53595;
    const password = process.env.ADCP_PASSWORD || '';

    const client = new ADCPClient(
        host,
        port,
        password);

        try {
            console.log('Connecting...');
            await client.connect();
            console.log('Connected!');

            console.log('Model:', await client.getModelName());
            console.log('Serial Number:', await client.getSerialNumber());
            console.log('Power status:', await client.getPowerStatus());
            console.log('Errors:', await client.getErrors());
            console.log('Warnings:', await client.getWarnings());
            console.log('Setting power OFF...');
            await client.setPower('off');
            console.log('Power status:', await client.getPowerStatus());
        } catch (err) {
            console.error('Error:', err);
        } finally {
            console.log('Disconnecting...');
            await client.close();
            console.log('Disconnected!');
        }
}

main();