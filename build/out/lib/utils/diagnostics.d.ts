import { DiagnosticSeverity } from "../enums.js";
export interface IDiagnostic {
    severity: DiagnosticSeverity;
    message: string;
}
export declare function Diagnostic(severity: DiagnosticSeverity, message: string): IDiagnostic;
