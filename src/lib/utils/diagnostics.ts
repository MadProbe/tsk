import type { DiagnosticSeverity } from "../enums";


export interface IDiagnostic {
    readonly severity: DiagnosticSeverity;
    readonly message: string;
}