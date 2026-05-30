// Re-export proto types for convenience
export * from "@vaye/proto";
export type { VayeClient, VayeClientConfig } from "./client";
export { createVayeClient, DEFAULT_GRPC_HOST } from "./client";
