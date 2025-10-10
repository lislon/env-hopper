import type { Tool } from 'ai'
import { z } from 'zod'
import { getDbClient } from '../../../db'

/**
 * Generic interface for executing raw SQL queries.
 * Can be implemented with Prisma's $queryRawUnsafe or any other SQL client.
 */
export interface DatabaseClient {
  /** Execute a SELECT query and return results */
  query: <T = unknown>(sql: string) => Promise<Array<T>>
  /** Execute an INSERT/UPDATE/DELETE and return affected row count */
  execute: (sql: string) => Promise<{ affectedRows: number }>
  /** Get list of tables in the database */
  getTables: () => Promise<Array<string>>
  /** Get columns for a specific table */
  getColumns: (
    tableName: string,
  ) => Promise<Array<{ name: string; type: string; nullable: boolean }>>
}

/**
 * Creates a DatabaseClient from a Prisma client.
 */
export function createPrismaDatabaseClient(prisma: {
  $queryRawUnsafe: <T>(sql: string) => Promise<T>
  $executeRawUnsafe: (sql: string) => Promise<number>
}): DatabaseClient {
  return {
    query: async <T = unknown>(sql: string): Promise<Array<T>> => {
      const result = await prisma.$queryRawUnsafe<Array<T>>(sql)
      return result
    },
    execute: async (sql: string) => {
      const affectedRows = await prisma.$executeRawUnsafe(sql)
      return { affectedRows }
    },
    getTables: async () => {
      const tables = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
        `SELECT tablename FROM pg_tables WHERE schemaname = 'public'`,
      )
      return tables.map((t) => t.tablename)
    },
    getColumns: async (tableName: string) => {
      const columns = await prisma.$queryRawUnsafe<
        Array<{
          column_name: string
          data_type: string
          is_nullable: string
        }>
      >(
        `SELECT column_name, data_type, is_nullable
         FROM information_schema.columns
         WHERE table_name = '${tableName}' AND table_schema = 'public'`,
      )
      return columns.map((c) => ({
        name: c.column_name,
        type: c.data_type,
        nullable: c.is_nullable === 'YES',
      }))
    },
  }
}

// Define zod schemas for tool parameters
const querySchema = z.object({
  sql: z.string().describe('The SELECT SQL query to execute'),
})

const modifySchema = z.object({
  sql: z
    .string()
    .describe('The INSERT, UPDATE, or DELETE SQL query to execute'),
  confirmed: z
    .boolean()
    .describe('Must be true to execute destructive operations'),
})

const schemaParamsSchema = z.object({
  tableName: z
    .string()
    .optional()
    .describe(
      'Specific table name to get columns for. If not provided, returns list of all tables.',
    ),
})

type QueryInput = z.infer<typeof querySchema>
type ModifyInput = z.infer<typeof modifySchema>
type SchemaInput = z.infer<typeof schemaParamsSchema>

/**
 * Creates a DatabaseClient using the internal backend-core Prisma client.
 * This is a convenience function for apps that don't need to pass their own Prisma client.
 */
function createInternalDatabaseClient(): DatabaseClient {
  return createPrismaDatabaseClient(getDbClient())
}

/**
 * Creates AI tools for generic database access.
 *
 * The AI uses these internally - users interact via natural language.
 * Results are formatted as tables by the AI based on the system prompt.
 * Uses the internal backend-core Prisma client automatically.
 */
export function createDatabaseTools(): Record<string, Tool> {
  const db = createInternalDatabaseClient()
  const queryDatabase: Tool<QueryInput, unknown> = {
    description: `Execute a SELECT query to read data from the database.
Use this to list, search, or filter records from any table.
Always use double quotes around table and column names for PostgreSQL (e.g., SELECT * FROM "App").
Return results will be formatted as a table for the user.`,
    inputSchema: querySchema,
    execute: async ({ sql }) => {
      console.log(`Executing ${sql}`)
      // Safety check - only allow SELECT
      const normalizedSql = sql.trim().toUpperCase()
      if (!normalizedSql.startsWith('SELECT')) {
        return {
          error:
            'Only SELECT queries are allowed with queryDatabase. Use modifyDatabase for changes.',
        }
      }
      try {
        const results = await db.query(sql)
        return {
          success: true,
          rowCount: Array.isArray(results) ? results.length : 0,
          data: results,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Query failed',
        }
      }
    },
  }

  const modifyDatabase: Tool<ModifyInput, unknown> = {
    description: `Execute an INSERT, UPDATE, or DELETE query to modify data.
Use double quotes around table and column names for PostgreSQL.
IMPORTANT: Always ask for user confirmation before executing. Set confirmed=true only after user confirms.
For UPDATE/DELETE, always include a WHERE clause to avoid affecting all rows.`,
    inputSchema: modifySchema,
    execute: async ({ sql, confirmed }) => {
      if (!confirmed) {
        return {
          needsConfirmation: true,
          message: 'Please confirm you want to execute this operation.',
          sql,
        }
      }

      // Safety check - don't allow SELECT here
      const normalizedSql = sql.trim().toUpperCase()
      if (normalizedSql.startsWith('SELECT')) {
        return { error: 'Use queryDatabase for SELECT queries.' }
      }

      // Extra safety - warn about missing WHERE on UPDATE/DELETE
      if (
        (normalizedSql.startsWith('UPDATE') ||
          normalizedSql.startsWith('DELETE')) &&
        !normalizedSql.includes('WHERE')
      ) {
        return {
          error:
            'UPDATE and DELETE queries must include a WHERE clause for safety.',
          sql,
        }
      }

      try {
        const result = await db.execute(sql)
        return {
          success: true,
          affectedRows: result.affectedRows,
          message: `Operation completed. ${result.affectedRows} row(s) affected.`,
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Operation failed',
        }
      }
    },
  }

  const getDatabaseSchema: Tool<SchemaInput, unknown> = {
    description: `Get information about database tables and their columns.
Use this to understand the database structure before writing queries.
Call without tableName to list all tables, or with tableName to get columns for a specific table.`,
    inputSchema: schemaParamsSchema,
    execute: async ({ tableName }) => {
      try {
        if (tableName) {
          const columns = await db.getColumns(tableName)
          return {
            success: true,
            table: tableName,
            columns,
          }
        } else {
          const tables = await db.getTables()
          return {
            success: true,
            tables,
          }
        }
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to get schema',
        }
      }
    },
  }

  return {
    queryDatabase,
    modifyDatabase,
    getDatabaseSchema,
  }
}

/**
 * Default system prompt for the database admin assistant.
 * Can be customized or extended.
 */
export const DEFAULT_ADMIN_SYSTEM_PROMPT = `You are a helpful database admin assistant. You help users view and manage data in the database.

IMPORTANT RULES:
1. When showing data, ALWAYS format it as a numbered ASCII table so users can reference rows by number
2. NEVER show raw SQL to users - just describe what you're doing in plain language
3. When users ask to modify data (update, delete, create), ALWAYS confirm before executing
4. For updates, show the current value and ask for confirmation before changing
5. Keep responses concise and focused on the data

FORMATTING EXAMPLE:
When user asks "show me all apps", respond like:
"Here are all the apps:

| # | ID | Slug    | Display Name    | Icon   |
|---|----|---------|-----------------| -------|
| 1 | 1  | portal  | Portal          | portal |
| 2 | 2  | admin   | Admin Dashboard | admin  |
| 3 | 3  | api     | API Service     | null   |

Found 3 apps total."

When user says "update row 2 display name to 'Admin Panel'":
1. First confirm: "I'll update the app 'Admin Dashboard' (ID: 2) to have display name 'Admin Panel'. Proceed?"
2. Only after user confirms, execute the update
3. Then show the updated row

AVAILABLE TABLES:
Use getDatabaseSchema tool to discover tables and their columns.
`
