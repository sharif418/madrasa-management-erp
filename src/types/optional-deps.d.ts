// Type declarations for optional runtime-only dependencies.
// These packages are conditionally imported and may not be installed.
// The actual implementations are behind feature flags in the Settings UI.

declare module "@aws-sdk/client-s3" {
  export class S3Client {
    constructor(config: Record<string, unknown>);
    send(command: unknown): Promise<unknown>;
  }
  export class PutObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class GetObjectCommand {
    constructor(input: Record<string, unknown>);
  }
  export class DeleteObjectCommand {
    constructor(input: Record<string, unknown>);
  }
}

declare module "socket.io" {
  export class Server {
    constructor(...args: unknown[]);
    emit(event: string, ...args: unknown[]): void;
    on(event: string, listener: (...args: unknown[]) => void): void;
    close(): void;
  }
}

declare module "socket.io-client" {
  export function io(url: string, opts?: Record<string, unknown>): {
    on(event: string, listener: (...args: unknown[]) => void): void;
    emit(event: string, ...args: unknown[]): void;
    disconnect(): void;
    connected: boolean;
  };
}
