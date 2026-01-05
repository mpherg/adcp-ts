export function formatCommand(cmd: string): string {
    return cmd.endsWith('\r\n') ? cmd: cmd + '\r\n';
}

export function parseResponse(response: string): any {
    if (response === 'ok') return true;
    if (response.startsWith('err')) throw new Error(response);

    try {
        return JSON.parse(response);
    } catch {
        return response;
    }
}