declare module "pg" {
  export type QueryResult<Row = Record<string, unknown>> = {
    rows: Row[]
  }

  export class Client {
    constructor(config: { connectionString: string })
    connect(): Promise<void>
    query<Row = Record<string, unknown>>(
      text: string,
      values?: readonly unknown[],
    ): Promise<QueryResult<Row>>
    end(): Promise<void>
  }

  const pg: {
    Client: typeof Client
  }

  export default pg
}
