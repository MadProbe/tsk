import { DiagnosticSeverity } from "../enums.js";


export interface IDiagnostic {
    severity: DiagnosticSeverity;
    message: string;
}
export function Diagnostic(severity: DiagnosticSeverity, message: string): IDiagnostic {
    return {
        severity,
        message
    };
}