import { Pool } from "pg"
import { env } from "./env.js"

// Global pool instance
let pool: Pool | null = null

export function getDbPool(): Pool {
    if (!pool) {
        if (!env.DATABASE_URL) {
            throw new Error("DATABASE_URL is not set")
        }
        pool = new Pool({
            connectionString: env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false, // Required for Neon in some envs
            },
        })
    }
    return pool
}

/**
 * Execute a read-only SQL query.
 * Throws if the query looks like a mutation.
 */
export async function runReadOnlyQuery(sql: string, params: any[] = []) {
    const lowerSql = sql.trim().toLowerCase()
    if (
        lowerSql.startsWith("insert") ||
        lowerSql.startsWith("update") ||
        lowerSql.startsWith("delete") ||
        lowerSql.startsWith("drop") ||
        lowerSql.startsWith("alter") ||
        lowerSql.startsWith("create") ||
        lowerSql.startsWith("truncate")
    ) {
        throw new Error("Only READ-ONLY queries are allowed through this tool.")
    }

    const client = await getDbPool().connect()
    try {
        const res = await client.query(sql, params)
        return res.rows
    } finally {
        client.release()
    }
}

export async function listTables() {
    const sql = `
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `
    return runReadOnlyQuery(sql)
}

export async function getTableSchema(tableName: string) {
    // Basic SQL injection prevention for table name
    if (!tableName.match(/^[a-zA-Z0-9_]+$/)) {
        throw new Error("Invalid table name")
    }

    const sql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1
      ORDER BY ordinal_position;
    `
    return runReadOnlyQuery(sql, [tableName])
}
