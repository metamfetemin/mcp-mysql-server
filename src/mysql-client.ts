import mysql from 'mysql2/promise';
import { z } from 'zod';

const ConnectionConfigSchema = z.object({
  host: z.string().default('localhost'),
  port: z.number().default(3306),
  user: z.string(),
  password: z.string(),
  database: z.string().optional(),
});

export type ConnectionConfig = z.infer<typeof ConnectionConfigSchema>;

export class MySQLClient {
  private connection: mysql.Connection | null = null;
  private config: ConnectionConfig;

  constructor(config: ConnectionConfig) {
    this.config = ConnectionConfigSchema.parse(config);
  }

  async connect(): Promise<void> {
    try {
      this.connection = await mysql.createConnection({
        host: this.config.host,
        port: this.config.port,
        user: this.config.user,
        password: this.config.password,
        database: this.config.database,
      });
    } catch (error) {
      throw new Error(`Failed to connect to MySQL: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async query(sql: string, params?: any[]): Promise<any[]> {
    if (!this.connection) {
      throw new Error('Not connected to database');
    }

    try {
      const [rows] = await this.connection.execute(sql, params);
      return Array.isArray(rows) ? rows : [];
    } catch (error) {
      throw new Error(`Query failed: ${error}`);
    }
  }

  async listDatabases(): Promise<string[]> {
    const rows = await this.query('SHOW DATABASES');
    return rows.map((row: any) => row.Database);
  }

  async listTables(database?: string): Promise<string[]> {
    let sql = 'SHOW TABLES';
    if (database) {
      sql = `SHOW TABLES FROM \`${database}\``;
    }
    const rows = await this.query(sql);
    if (rows.length === 0) return [];
    const firstRow = rows[0];
    if (!firstRow) return [];
    const key = Object.keys(firstRow)[0];
    if (!key) return [];
    return rows.map((row: any) => row[key]);
  }

  async describeTable(tableName: string, database?: string): Promise<any[]> {
    let sql = `DESCRIBE \`${tableName}\``;
    if (database) {
      sql = `DESCRIBE \`${database}\`.\`${tableName}\``;
    }
    return await this.query(sql);
  }

  async getTableData(tableName: string, limit: number = 100, database?: string): Promise<any[]> {
    let sql = `SELECT * FROM \`${tableName}\` LIMIT ?`;
    if (database) {
      sql = `SELECT * FROM \`${database}\`.\`${tableName}\` LIMIT ?`;
    }
    return await this.query(sql, [limit]);
  }

  async insertData(tableName: string, data: Record<string, any>, database?: string): Promise<any> {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map(() => '?').join(', ');
    
    let sql = `INSERT INTO \`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
    if (database) {
      sql = `INSERT INTO \`${database}\`.\`${tableName}\` (\`${columns.join('`, `')}\`) VALUES (${placeholders})`;
    }
    
    const [result] = await this.connection!.execute(sql, values);
    return result;
  }

  async updateData(tableName: string, data: Record<string, any>, where: Record<string, any>, database?: string): Promise<any> {
    const setClause = Object.keys(data).map(key => `\`${key}\` = ?`).join(', ');
    const whereClause = Object.keys(where).map(key => `\`${key}\` = ?`).join(' AND ');
    const values = [...Object.values(data), ...Object.values(where)];
    
    let sql = `UPDATE \`${tableName}\` SET ${setClause} WHERE ${whereClause}`;
    if (database) {
      sql = `UPDATE \`${database}\`.\`${tableName}\` SET ${setClause} WHERE ${whereClause}`;
    }
    
    const [result] = await this.connection!.execute(sql, values);
    return result;
  }

  async deleteData(tableName: string, where: Record<string, any>, database?: string): Promise<any> {
    const whereClause = Object.keys(where).map(key => `\`${key}\` = ?`).join(' AND ');
    const values = Object.values(where);
    
    let sql = `DELETE FROM \`${tableName}\` WHERE ${whereClause}`;
    if (database) {
      sql = `DELETE FROM \`${database}\`.\`${tableName}\` WHERE ${whereClause}`;
    }
    
    const [result] = await this.connection!.execute(sql, values);
    return result;
  }
}