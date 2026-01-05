export type PowerState = 'on' | 'off';

export interface PowerStatus {
    state: 'on' | 'off' | 'warming' | 'cooling';
}

export interface ErrorStatus {
    hasError: boolean;
    code?: string;
}

export interface WarningStatus {
    hasWarning: boolean;
    code?: string;
}