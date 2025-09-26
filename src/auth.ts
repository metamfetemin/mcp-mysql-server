import { z } from 'zod';

export enum UserRole {
  ADMIN = 'admin',
  READ_WRITE = 'read_write',
  READ_ONLY = 'read_only'
}

export enum Permission {
  SELECT = 'select',
  INSERT = 'insert',
  UPDATE = 'update',
  DELETE = 'delete',
  SHOW = 'show',
  DESCRIBE = 'describe'
}

const UserSchema = z.object({
  username: z.string(),
  password: z.string(),
  role: z.nativeEnum(UserRole),
});

export type User = z.infer<typeof UserSchema>;

export class AuthManager {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, string> = new Map(); // sessionId -> username

  constructor() {
    // Default users from environment or hardcoded
    this.initializeDefaultUsers();
  }

  private initializeDefaultUsers() {
    // Admin user from environment
    const adminUser: User = {
      username: process.env.MYSQL_ADMIN_USER || 'admin',
      password: process.env.MYSQL_ADMIN_PASSWORD || 'admin123',
      role: UserRole.ADMIN
    };

    // Read-write user
    const readWriteUser: User = {
      username: process.env.MYSQL_RW_USER || 'readwrite',
      password: process.env.MYSQL_RW_PASSWORD || 'rw123',
      role: UserRole.READ_WRITE
    };

    // Read-only user
    const readOnlyUser: User = {
      username: process.env.MYSQL_RO_USER || 'readonly',
      password: process.env.MYSQL_RO_PASSWORD || 'ro123',
      role: UserRole.READ_ONLY
    };

    this.users.set(adminUser.username, adminUser);
    this.users.set(readWriteUser.username, readWriteUser);
    this.users.set(readOnlyUser.username, readOnlyUser);
  }

  authenticate(username: string, password: string): string | null {
    const user = this.users.get(username);
    if (!user || user.password !== password) {
      return null;
    }

    // Generate simple session ID
    const sessionId = Math.random().toString(36).substring(7);
    this.sessions.set(sessionId, username);
    return sessionId;
  }

  getUserFromSession(sessionId: string): User | null {
    const username = this.sessions.get(sessionId);
    if (!username) return null;
    return this.users.get(username) || null;
  }

  hasPermission(user: User, permission: Permission): boolean {
    switch (user.role) {
      case UserRole.ADMIN:
        return true; // Admin can do everything
      
      case UserRole.READ_WRITE:
        return [Permission.SELECT, Permission.INSERT, Permission.UPDATE, Permission.SHOW, Permission.DESCRIBE].includes(permission);
      
      case UserRole.READ_ONLY:
        return [Permission.SELECT, Permission.SHOW, Permission.DESCRIBE].includes(permission);
      
      default:
        return false;
    }
  }

  getPermissionForOperation(operation: string): Permission {
    switch (operation.toLowerCase()) {
      case 'mysql_query':
        // For queries, we need to parse the SQL to determine permission
        return Permission.SELECT; // Default to SELECT, will be checked later
      case 'mysql_list_databases':
      case 'mysql_list_tables':
        return Permission.SHOW;
      case 'mysql_describe_table':
        return Permission.DESCRIBE;
      case 'mysql_get_table_data':
        return Permission.SELECT;
      case 'mysql_insert':
        return Permission.INSERT;
      case 'mysql_update':
        return Permission.UPDATE;
      case 'mysql_delete':
        return Permission.DELETE;
      default:
        return Permission.SELECT;
    }
  }

  parseQueryPermission(sql: string): Permission {
    const trimmedSql = sql.trim().toLowerCase();
    
    if (trimmedSql.startsWith('select')) return Permission.SELECT;
    if (trimmedSql.startsWith('insert')) return Permission.INSERT;
    if (trimmedSql.startsWith('update')) return Permission.UPDATE;
    if (trimmedSql.startsWith('delete')) return Permission.DELETE;
    if (trimmedSql.startsWith('show')) return Permission.SHOW;
    if (trimmedSql.startsWith('describe') || trimmedSql.startsWith('desc')) return Permission.DESCRIBE;
    
    // Default to SELECT for safety
    return Permission.SELECT;
  }

  logout(sessionId: string): void {
    this.sessions.delete(sessionId);
  }
}