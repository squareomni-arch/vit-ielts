/**
 * Mock Supabase Client Factory
 *
 * Creates a chainable mock that mimics the Supabase PostgREST query builder.
 * Supports: .from(), .select(), .insert(), .update(), .delete(),
 *           .eq(), .neq(), .ilike(), .single(), .maybeSingle(),
 *           .range(), .order(), .limit()
 *
 * Usage:
 *   const mock = createMockSupabase({
 *     quizzes: [{ id: "1", title: "Test" }],
 *   });
 *   // mock.from("quizzes").select("*").eq("id", "1").single()
 *   //   => { data: { id: "1", title: "Test" }, error: null }
 */

import { vi } from "vitest";

type MockData = Record<string, Record<string, unknown>[]>;

type QueryResult = {
  data: unknown;
  error: unknown;
  count?: number;
};

/**
 * Build a chainable query builder mock.
 * The builder accumulates filters and resolves on terminal methods
 * (.single(), .maybeSingle(), or when the chain ends).
 */
function createQueryBuilder(
  initialData: Record<string, unknown>[],
  operation: "select" | "insert" | "update" | "delete" = "select"
) {
  let data = [...initialData];
  let selectFields: string | null = null;
  let countOpt: string | null = null;
  let shouldReturnInserted = false;

  const builder: Record<string, unknown> = {};

  // Filtering
  builder.eq = vi.fn((field: string, value: unknown) => {
    data = data.filter((row) => row[field] === value);
    return builder;
  });

  builder.neq = vi.fn((field: string, value: unknown) => {
    data = data.filter((row) => row[field] !== value);
    return builder;
  });

  builder.ilike = vi.fn((field: string, pattern: string) => {
    const regex = new RegExp(
      pattern.replace(/%/g, ".*").replace(/_/g, "."),
      "i"
    );
    data = data.filter((row) => regex.test(String(row[field] ?? "")));
    return builder;
  });

  builder.in = vi.fn(() => builder);
  builder.contains = vi.fn(() => builder);

  // Pagination & ordering
  builder.range = vi.fn((from: number, to: number) => {
    data = data.slice(from, to + 1);
    return builder;
  });

  builder.order = vi.fn(() => builder);
  builder.limit = vi.fn((n: number) => {
    data = data.slice(0, n);
    return builder;
  });

  // Select (for inserts that need to return data)
  builder.select = vi.fn((fields?: string, opts?: { count?: string }) => {
    selectFields = fields ?? "*";
    if (opts?.count) countOpt = opts.count;
    shouldReturnInserted = true;
    return builder;
  });

  // Terminal: single row
  builder.single = vi.fn((): QueryResult => {
    if (data.length === 0) {
      return { data: null, error: { code: "PGRST116", message: "Not found" } };
    }
    return { data: data[0], error: null };
  });

  // Terminal: maybe single (no error if not found)
  builder.maybeSingle = vi.fn((): QueryResult => {
    return { data: data[0] ?? null, error: null };
  });

  // Make the builder itself thenable (for `await query`)
  builder.then = vi.fn((resolve: (value: QueryResult) => void) => {
    const result: QueryResult = {
      data: operation === "delete" ? null : data,
      error: null,
      count: data.length,
    };
    resolve(result);
  });

  return builder;
}

/**
 * Create a mock Supabase client.
 *
 * @param tableData - Map of table name → rows
 * @param userId - Mock authenticated user ID (null = not authenticated)
 */
export function createMockSupabase(
  tableData: MockData = {},
  userId: string | null = "user-001"
) {
  // Deep-clone to avoid test cross-contamination
  const tables: MockData = JSON.parse(JSON.stringify(tableData));

  // Track inserts for verification
  const insertedRows: Record<string, unknown[]> = {};
  const deletedTables: string[] = [];
  const updatedData: Record<string, unknown[]> = {};
  const rpcCalls: Array<{ fn: string; params: unknown }> = [];

  const supabase = {
    auth: {
      getUser: vi.fn(async () => {
        if (!userId) {
          return { data: { user: null }, error: null };
        }
        return {
          data: { user: { id: userId } },
          error: null,
        };
      }),
    },

    from: vi.fn((table: string) => {
      const rows = tables[table] ?? [];

      return {
        select: vi.fn((fields?: string, opts?: { count?: string }) => {
          return createQueryBuilder(rows, "select");
        }),

        insert: vi.fn((data: unknown) => {
          const rowsToInsert = Array.isArray(data) ? data : [data];
          // Auto-assign IDs if missing
          const withIds = rowsToInsert.map((row: Record<string, unknown>, i) => ({
            id: row.id ?? `${table}-auto-${Date.now()}-${i}`,
            ...row,
          }));

          // Store for later retrieval
          if (!insertedRows[table]) insertedRows[table] = [];
          insertedRows[table].push(...withIds);

          // Also add to tables for subsequent queries
          if (!tables[table]) tables[table] = [];
          tables[table].push(...withIds);

          return createQueryBuilder(withIds as Record<string, unknown>[], "insert");
        }),

        update: vi.fn((data: unknown) => {
          if (!updatedData[table]) updatedData[table] = [];
          updatedData[table].push(data);

          // Return a builder that filters+returns updated rows
          const builder = createQueryBuilder(rows, "update");

          // Override .single to return the updated data merged with existing
          const originalEq = builder.eq as ReturnType<typeof vi.fn>;
          const filters: Array<{ field: string; value: unknown }> = [];

          builder.eq = vi.fn((field: string, value: unknown) => {
            filters.push({ field, value });
            return originalEq(field, value);
          });

          builder.select = vi.fn(() => {
            // Find matching rows and merge with updated data
            let matched = [...rows];
            for (const f of filters) {
              matched = matched.filter((r) => r[f.field] === f.value);
            }
            const merged = matched.map((r) => ({ ...r, ...(data as Record<string, unknown>) }));
            return createQueryBuilder(
              merged as Record<string, unknown>[],
              "update"
            );
          });

          return builder;
        }),

        delete: vi.fn(() => {
          deletedTables.push(table);
          return createQueryBuilder([], "delete");
        }),

        upsert: vi.fn((data: unknown) => {
          return createQueryBuilder(
            Array.isArray(data) ? data : [data],
            "insert"
          );
        }),
      };
    }),

    rpc: vi.fn(async (fn: string, params?: unknown) => {
      rpcCalls.push({ fn, params });
      return { data: null, error: null };
    }),

    // Expose tracking data for assertions
    _tracking: {
      insertedRows,
      deletedTables,
      updatedData,
      rpcCalls,
    },
  };

  return supabase;
}

export type MockSupabaseClient = ReturnType<typeof createMockSupabase>;
