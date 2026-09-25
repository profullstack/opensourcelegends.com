/**
 * Type declarations for @profullstack/libsql-pg 0.1.0.
 *
 * The package's package.json points `types` at an index.d.ts that is not in
 * the published tarball, so under `strict` the import is an implicit any.
 * This mirrors the surface the package documents (the @libsql/client shape
 * over Postgres). Delete this file once the package ships its own types.
 */
declare module '@profullstack/libsql-pg' {
  export type InValue = null | string | number | bigint | boolean | Uint8Array | Date | undefined;
  export type InArgs = InValue[] | Record<string, InValue>;
  export interface InStatement {
    sql: string;
    args?: InArgs;
  }
  export interface Row {
    [column: string]: unknown;
    [index: number]: unknown;
    length: number;
  }
  export interface ResultSet {
    columns: string[];
    columnTypes: string[];
    rows: Row[];
    rowsAffected: number;
    lastInsertRowid: bigint | undefined;
    toJSON(): unknown;
  }
  export type TransactionMode = 'write' | 'read' | 'deferred';
  export interface Transaction {
    execute(statement: InStatement | string, args?: InArgs): Promise<ResultSet>;
    batch(statements: (InStatement | string)[]): Promise<ResultSet[]>;
    executeMultiple(sql: string): Promise<void>;
    commit(): Promise<void>;
    rollback(): Promise<void>;
    close(): Promise<void>;
    readonly closed: boolean;
  }
  export interface Rewritten {
    sql: string;
    noop: boolean;
    warnings: string[];
    kind: 'pragma' | 'ddl' | 'dml' | 'comment';
  }
  /** The underlying pg Pool; typed loosely so this shim needs no @types/pg. */
  export interface RawPool {
    query(text: string, values?: unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
    end(): Promise<void>;
  }
  export interface Client {
    protocol: 'postgres';
    closed: boolean;
    execute(statement: InStatement | string, args?: InArgs): Promise<ResultSet>;
    batch(statements: (InStatement | string)[], mode?: TransactionMode): Promise<ResultSet[]>;
    transaction(mode?: TransactionMode): Promise<Transaction>;
    executeMultiple(sql: string): Promise<void>;
    sync(): Promise<void>;
    close(): Promise<void>;
    explainRewrite(sql: string): Promise<Rewritten>;
    pool: RawPool;
  }
  export interface Config {
    url: string;
    authToken?: string;
    syncUrl?: string;
    dialect?: 'sqlite' | 'postgres';
    pool?: { max?: number; idleTimeoutMillis?: number; connectionTimeoutMillis?: number };
    intMode?: 'number' | 'bigint' | 'string';
    timestamps?: 'iso' | 'date';
    nativeBooleans?: boolean;
    statementTimeoutMs?: number;
    applicationName?: string;
    ssl?: boolean | object;
    onWarning?: (message: string, sql: string) => void;
  }
  export interface TableKeys {
    pk: string[];
    unique: string[][];
    columns: string[];
  }
  export function createClient(config: Config): Client;
  export function rewriteSql(sql: string, opts?: { keys?: (table: string) => TableKeys | undefined }): Rewritten;
  export function unsupportedIdioms(sql: string): string[];
  export function positional(sql: string): string;
  export function convertSchema(sql: string, opts?: Record<string, unknown>): string;
  export function splitStatements(sql: string): string[];
}
