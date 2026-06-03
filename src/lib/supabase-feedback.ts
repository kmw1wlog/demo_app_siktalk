type SupabaseRow = Record<string, unknown>;

const restPath = "/rest/v1/";
const allowedTables = new Set(["leads", "pre_surveys", "app_events", "post_surveys", "rewards"]);

export async function insertSupabaseRow<T extends SupabaseRow>(
  table: string,
  row: SupabaseRow,
): Promise<T> {
  if (!allowedTables.has(table)) {
    throw new Error(`Unsupported feedback table: ${table}`);
  }

  const baseUrl = getSupabaseRestUrl();
  const restApiKey = getSupabaseRestApiKey();

  if (baseUrl && restApiKey) {
    try {
      return await insertViaRest<T>(baseUrl, restApiKey, table, row);
    } catch (error) {
      if (!process.env.SUPABASE_POSTGRES_URL) {
        throw error;
      }
    }
  }

  return insertViaPostgres<T>(table, row);
}

async function insertViaRest<T extends SupabaseRow>(
  baseUrl: string,
  apiKey: string,
  table: string,
  row: SupabaseRow,
): Promise<T> {
  const response = await fetch(`${baseUrl}${encodeURIComponent(table)}`, {
    method: "POST",
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(row),
  });

  const data = (await response.json().catch(() => null)) as unknown;
  if (!response.ok) {
    const message = getSupabaseErrorMessage(data) || `Supabase insert failed for ${table}.`;
    throw new Error(message);
  }
  if (!Array.isArray(data) || !data[0] || typeof data[0] !== "object") {
    throw new Error(`Supabase did not return inserted ${table} row.`);
  }
  return data[0] as T;
}

async function insertViaPostgres<T extends SupabaseRow>(table: string, row: SupabaseRow): Promise<T> {
  const { Pool } = await import("pg");
  const columns = Object.keys(row);
  if (!columns.length) {
    throw new Error(`No values provided for ${table}.`);
  }
  const pool = new Pool({
    connectionString: getPostgresConnectionString(),
    ssl: { rejectUnauthorized: false },
  });
  const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
  const values = columns.map((column) => normalizePostgresValue(row[column]));
  const query = `insert into public.${table} (${columns.join(", ")}) values (${placeholders}) returning *`;

  try {
    const result = await pool.query<T>(query, values);
    if (!result.rows[0]) {
      throw new Error(`Postgres did not return inserted ${table} row.`);
    }
    return result.rows[0];
  } finally {
    await pool.end();
  }
}

function getSupabaseRestUrl(): string | null {
  const value = process.env.SUPABASE_URL;
  if (!value) return null;
  if (value.endsWith(restPath)) return value;
  const withoutSlash = value.replace(/\/+$/, "");
  return withoutSlash.endsWith(restPath.slice(0, -1))
    ? `${withoutSlash}/`
    : `${withoutSlash}${restPath}`;
}

function getSupabaseRestApiKey(): string | null {
  return (
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    null
  );
}

function getPostgresConnectionString(): string {
  const explicit = process.env.SUPABASE_POSTGRES_URL;
  if (explicit) {
    return explicit;
  }
  throw new Error("SUPABASE_POSTGRES_URL이 없으면 Postgres fallback을 사용할 수 없습니다.");
}

export function getSupabaseDebugInfo() {
  const key = getSupabaseRestApiKey();
  return {
    supabaseUrl: process.env.SUPABASE_URL || null,
    serviceRoleExists: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    restApiKeyExists: Boolean(key),
    restApiKeyLength: key?.length ?? 0,
    restApiKeyPrefix: key ? key.slice(0, 10) : null,
    postgresFallbackEnabled: Boolean(process.env.SUPABASE_POSTGRES_URL),
  };
}

function normalizePostgresValue(value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return JSON.stringify(value);
  }
  return value;
}

function getSupabaseErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const record = data as Record<string, unknown>;
  const message = record.message;
  return typeof message === "string" ? message : null;
}
