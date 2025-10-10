export class DexieErrorWrapper extends Error {
    public readonly cause: Error;
    constructor(inner: unknown) {
        super(inner instanceof Error ? inner.message : String(inner));
        this.name = 'DexieErrorWrapper';
        this.stack = inner instanceof Error ? inner.stack : undefined;
        this.cause = inner instanceof Error ? inner : new Error(String(inner));
    }
}

export function isDexieError(error: unknown): error is DexieErrorWrapper {
    return error instanceof DexieErrorWrapper;
}

export function isDexieMigrationError(error: unknown): boolean {
    if (error instanceof DexieErrorWrapper) {
        const cause = error.cause
        if (cause instanceof Error) {
            const errorName = cause.name.toLowerCase()
            const errorMessage = cause.message.toLowerCase()
            return (
                errorName.includes('upgradeerror') ||
                errorName.includes('versionerror') ||
                errorMessage.includes('upgrade') ||
                errorMessage.includes('migration') ||
                errorMessage.includes('version')
            )
        }
    }
    return false
}