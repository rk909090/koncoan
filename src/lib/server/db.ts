import "server-only";
import mysql, { type Pool, type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { MENU } from "@/data/menu";

/**
 * Koneksi MySQL/MariaDB (pool) + migrasi skema otomatis.
 * Kredensial dibaca dari environment variable — tidak pernah ditulis di kode.
 *   DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD
 * Waktu disimpan dalam UTC (UTC_TIMESTAMP()); tampilan & laporan memakai WIB (UTC+7).
 */

function requiredEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Environment variable ${name} belum di-set`);
  return v;
}

const globalForDb = globalThis as unknown as {
  __koncoanPool?: Pool;
  __koncoanMigrated?: Promise<void>;
};

function getPool(): Pool {
  if (!globalForDb.__koncoanPool) {
    globalForDb.__koncoanPool = mysql.createPool({
      host: requiredEnv("DB_HOST"),
      port: Number(process.env.DB_PORT || 3306),
      database: requiredEnv("DB_NAME"),
      user: requiredEnv("DB_USER"),
      password: requiredEnv("DB_PASSWORD"),
      // shared hosting: batasi jumlah koneksi per proses
      connectionLimit: 4,
      connectTimeout: 5000,
      waitForConnections: true,
      charset: "utf8mb4",
      timezone: "Z",
      // DATETIME dikembalikan sebagai string UTC "YYYY-MM-DD HH:MM:SS"
      dateStrings: true,
      decimalNumbers: true,
      supportBigNumbers: true,
    });
  }
  return globalForDb.__koncoanPool;
}

/* ——————————————————— Migrasi ——————————————————— */

type Migration = { version: number; name: string; statements: string[] };

const MIGRATIONS: Migration[] = [
  {
    version: 1,
    name: "initial schema",
    statements: [
      `CREATE TABLE IF NOT EXISTS admin_users (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('admin','kasir') NOT NULL DEFAULT 'kasir',
        active TINYINT(1) NOT NULL DEFAULT 1,
        last_login_at DATETIME NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uq_admin_users_username (username)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS admin_sessions (
        id CHAR(64) NOT NULL PRIMARY KEY,
        user_id INT UNSIGNED NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at DATETIME NOT NULL,
        ip VARCHAR(64) NULL,
        user_agent VARCHAR(255) NULL,
        KEY idx_admin_sessions_user (user_id),
        KEY idx_admin_sessions_expires (expires_at),
        CONSTRAINT fk_admin_sessions_user FOREIGN KEY (user_id) REFERENCES admin_users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS login_attempts (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL,
        ip VARCHAR(64) NOT NULL,
        success TINYINT(1) NOT NULL,
        created_at DATETIME NOT NULL,
        KEY idx_login_attempts_lookup (username, ip, created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) NOT NULL PRIMARY KEY,
        name VARCHAR(120) NOT NULL,
        category VARCHAR(32) NOT NULL,
        price INT UNSIGNED NOT NULL,
        description VARCHAR(255) NULL,
        image VARCHAR(255) NULL,
        serving VARCHAR(32) NULL,
        active TINYINT(1) NOT NULL DEFAULT 1,
        sort_order INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        KEY idx_products_category (category, sort_order)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS customers (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NULL,
        address VARCHAR(255) NULL,
        notes VARCHAR(500) NULL,
        created_at DATETIME NOT NULL,
        updated_at DATETIME NOT NULL,
        UNIQUE KEY uq_customers_phone (phone),
        KEY idx_customers_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS daily_counters (
        counter_date DATE NOT NULL PRIMARY KEY,
        seq INT UNSIGNED NOT NULL
      ) ENGINE=InnoDB`,
      `CREATE TABLE IF NOT EXISTS orders (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        order_no VARCHAR(24) NOT NULL,
        customer_id INT UNSIGNED NULL,
        cashier_id INT UNSIGNED NULL,
        order_type ENUM('dine-in','take-away','delivery') NOT NULL,
        status ENUM('paid','void') NOT NULL DEFAULT 'paid',
        subtotal INT UNSIGNED NOT NULL,
        discount INT UNSIGNED NOT NULL DEFAULT 0,
        total INT UNSIGNED NOT NULL,
        payment_method ENUM('cash','qris','transfer','other') NOT NULL,
        amount_paid INT UNSIGNED NOT NULL DEFAULT 0,
        change_amount INT UNSIGNED NOT NULL DEFAULT 0,
        note VARCHAR(500) NULL,
        void_reason VARCHAR(255) NULL,
        voided_at DATETIME NULL,
        voided_by INT UNSIGNED NULL,
        created_at DATETIME NOT NULL,
        UNIQUE KEY uq_orders_order_no (order_no),
        KEY idx_orders_created (created_at),
        KEY idx_orders_status_created (status, created_at),
        KEY idx_orders_customer (customer_id, created_at),
        CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
        CONSTRAINT fk_orders_cashier FOREIGN KEY (cashier_id) REFERENCES admin_users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
      `CREATE TABLE IF NOT EXISTS order_items (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
        order_id INT UNSIGNED NOT NULL,
        product_id VARCHAR(64) NULL,
        product_name VARCHAR(120) NOT NULL,
        category VARCHAR(32) NOT NULL,
        unit_price INT UNSIGNED NOT NULL,
        qty INT UNSIGNED NOT NULL,
        line_total INT UNSIGNED NOT NULL,
        note VARCHAR(255) NULL,
        KEY idx_order_items_order (order_id),
        KEY idx_order_items_product (product_id),
        CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
    ],
  },
];

async function runMigrations() {
  const pool = getPool();
  await pool.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version INT UNSIGNED NOT NULL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    applied_at DATETIME NOT NULL
  ) ENGINE=InnoDB`);
  const [rows] = await pool.query<RowDataPacket[]>("SELECT version FROM schema_migrations");
  const done = new Set(rows.map((r) => Number(r.version)));
  for (const m of MIGRATIONS) {
    if (done.has(m.version)) continue;
    for (const sql of m.statements) await pool.query(sql);
    await pool.query(
      "INSERT IGNORE INTO schema_migrations (version, name, applied_at) VALUES (?, ?, UTC_TIMESTAMP())",
      [m.version, m.name],
    );
  }
  await seedProducts();
  await bootstrapAdmin();
}

/** Produk awal diambil dari menu situs (src/data/menu.ts); hanya menambah yang belum ada. */
async function seedProducts() {
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM products");
  if (Number(rows[0].n) > 0) return;
  let i = 0;
  for (const m of MENU) {
    await pool.query(
      `INSERT IGNORE INTO products (id, name, category, price, description, image, serving, active, sort_order, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
      [m.id, m.name, m.category, m.price, m.description, m.image, m.portion ?? null, i++],
    );
  }
}

/**
 * Akun admin pertama dibuat dari env ADMIN_BOOTSTRAP_USERNAME/PASSWORD,
 * HANYA jika tabel admin_users masih kosong. Setelah itu env ini diabaikan.
 */
async function bootstrapAdmin() {
  const username = process.env.ADMIN_BOOTSTRAP_USERNAME?.trim();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD;
  if (!username || !password) return;
  const pool = getPool();
  const [rows] = await pool.query<RowDataPacket[]>("SELECT COUNT(*) AS n FROM admin_users");
  if (Number(rows[0].n) > 0) return;
  const { hashPassword } = await import("./password");
  await pool.query(
    `INSERT INTO admin_users (username, name, password_hash, role, active, created_at, updated_at)
     VALUES (?, ?, ?, 'admin', 1, UTC_TIMESTAMP(), UTC_TIMESTAMP())`,
    [username.toLowerCase(), "Administrator", await hashPassword(password)],
  );
}

function ensureMigrated() {
  if (!globalForDb.__koncoanMigrated) {
    globalForDb.__koncoanMigrated = runMigrations().catch((e) => {
      globalForDb.__koncoanMigrated = undefined; // coba lagi di request berikutnya
      throw e;
    });
  }
  return globalForDb.__koncoanMigrated;
}

/* ——————————————————— Helper query ——————————————————— */

export type Row = RowDataPacket;
type Param = string | number | boolean | null | Date;

export async function query<T extends Row = Row>(sql: string, params: Param[] = []): Promise<T[]> {
  await ensureMigrated();
  const [rows] = await getPool().query<T[]>(sql, params);
  return rows;
}

export async function queryOne<T extends Row = Row>(sql: string, params: Param[] = []): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function execute(sql: string, params: Param[] = []): Promise<ResultSetHeader> {
  await ensureMigrated();
  const [res] = await getPool().query<ResultSetHeader>(sql, params);
  return res;
}

/** Jalankan beberapa query dalam satu transaksi. */
export async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  await ensureMigrated();
  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

export async function dbVersion() {
  const r = await queryOne<Row & { v: string }>("SELECT VERSION() AS v");
  return r?.v ?? "unknown";
}
