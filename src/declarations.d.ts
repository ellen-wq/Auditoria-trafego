declare module 'sql.js' {
  export interface BindParams {
    [key: string]: unknown;
  }

  export interface QueryResults {
    columns: string[];
    values: unknown[][];
  }

  export interface Statement {
    bind(params?: unknown[] | BindParams): boolean;
    step(): boolean;
    getAsObject(): Record<string, unknown>;
    free(): boolean;
    run(params?: unknown[] | BindParams): void;
  }

  export interface Database {
    run(sql: string, params?: unknown[] | BindParams): Database;
    exec(sql: string): QueryResults[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
    getRowsModified(): number;
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | Buffer) => Database;
  }

  export default function initSqlJs(config?: Record<string, unknown>): Promise<SqlJsStatic>;
}
