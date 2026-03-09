/**
 * Global type declarations for legacy affiliate data helpers.
 * 
 * readData/writeData are injected at runtime by legacy middleware
 * or are no longer used. These declarations suppress TS errors 
 * in the remaining affiliate API routes until they are fully 
 * migrated to Supabase services.
 */

declare function readData<T>(fileName: string): T | Promise<T>;
declare function writeData<T>(fileName: string, data: T): void | Promise<void>;

export {};
