#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { MySQLClient, ConnectionConfig } from './mysql-client.js';
import { AuthManager, Permission, UserRole } from './auth.js';
import { QueryCache } from './cache.js';
import { ConfigWatcher } from './config-watcher.js';

const server = new Server(
  {
    name: 'mcp-mysql',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

let mysqlClient: MySQLClient | null = null;
let authManager: AuthManager;
let queryCache: QueryCache;
let configWatcher: ConfigWatcher;

// Initialize all services
const initializeServices = async () => {
  try {
    // Initialize config watcher
    configWatcher = new ConfigWatcher();
    configWatcher.updateProcessEnv();

    // Initialize auth manager
    authManager = new AuthManager();

    // Initialize query cache
    queryCache = new QueryCache();

    // Initialize MySQL client with current config
    await initializeMySQLClient();

    // Listen for config changes
    configWatcher.onChange(async (newConfig) => {
      console.log('Config changed, reconnecting to MySQL...');
      try {
        if (mysqlClient) {
          await mysqlClient.disconnect();
        }
        await initializeMySQLClient();
        // Clear cache when config changes
        queryCache.invalidate();
      } catch (error) {
        console.error('Failed to reconnect after config change:', error);
      }
    });

  } catch (error) {
    console.error('Failed to initialize services:', error);
    process.exit(1);
  }
};

// Initialize MySQL client
const initializeMySQLClient = async () => {
  const config = configWatcher.getConfig();
  const connectionConfig: ConnectionConfig = {
    host: config.MYSQL_HOST,
    port: config.MYSQL_PORT,
    user: config.MYSQL_USER,
    password: config.MYSQL_PASSWORD,
    database: config.MYSQL_DATABASE,
  };

  if (!connectionConfig.user || !connectionConfig.password) {
    throw new Error('MYSQL_USER and MYSQL_PASSWORD are required');
  }

  mysqlClient = new MySQLClient(connectionConfig);
  await mysqlClient.connect();
};

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'mysql_auth',
        description: 'Authenticate user and get session token',
        inputSchema: {
          type: 'object',
          properties: {
            username: {
              type: 'string',
              description: 'Username for authentication',
            },
            password: {
              type: 'string',
              description: 'Password for authentication',
            },
          },
          required: ['username', 'password'],
        },
      },
      {
        name: 'mysql_query',
        description: 'Execute a SQL query on the MySQL database',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            query: {
              type: 'string',
              description: 'The SQL query to execute',
            },
            params: {
              type: 'array',
              description: 'Optional parameters for the SQL query',
              items: {
                type: 'string',
              },
            },
          },
          required: ['session_id', 'query'],
        },
      },
      {
        name: 'mysql_list_databases',
        description: 'List all databases on the MySQL server',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'mysql_list_tables',
        description: 'List all tables in a database',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            database: {
              type: 'string',
              description: 'Database name (optional, uses current database if not specified)',
            },
          },
          required: ['session_id'],
        },
      },
      {
        name: 'mysql_describe_table',
        description: 'Get the structure/schema of a table',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            table: {
              type: 'string',
              description: 'Table name to describe',
            },
            database: {
              type: 'string',
              description: 'Database name (optional)',
            },
          },
          required: ['session_id', 'table'],
        },
      },
      {
        name: 'mysql_get_table_data',
        description: 'Get data from a table with optional limit',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            table: {
              type: 'string',
              description: 'Table name to query',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of rows to return (default: 100)',
              default: 100,
            },
            database: {
              type: 'string',
              description: 'Database name (optional)',
            },
          },
          required: ['session_id', 'table'],
        },
      },
      {
        name: 'mysql_insert',
        description: 'Insert data into a table',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            table: {
              type: 'string',
              description: 'Table name to insert into',
            },
            data: {
              type: 'object',
              description: 'Data to insert (key-value pairs)',
            },
            database: {
              type: 'string',
              description: 'Database name (optional)',
            },
          },
          required: ['session_id', 'table', 'data'],
        },
      },
      {
        name: 'mysql_update',
        description: 'Update data in a table',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            table: {
              type: 'string',
              description: 'Table name to update',
            },
            data: {
              type: 'object',
              description: 'Data to update (key-value pairs)',
            },
            where: {
              type: 'object',
              description: 'WHERE conditions (key-value pairs)',
            },
            database: {
              type: 'string',
              description: 'Database name (optional)',
            },
          },
          required: ['session_id', 'table', 'data', 'where'],
        },
      },
      {
        name: 'mysql_delete',
        description: 'Delete data from a table',
        inputSchema: {
          type: 'object',
          properties: {
            session_id: {
              type: 'string',
              description: 'Session ID from authentication',
            },
            table: {
              type: 'string',
              description: 'Table name to delete from',
            },
            where: {
              type: 'object',
              description: 'WHERE conditions (key-value pairs)',
            },
            database: {
              type: 'string',
              description: 'Database name (optional)',
            },
          },
          required: ['session_id', 'table', 'where'],
        },
      },
    ],
  };
});

// Helper function to authenticate and authorize
const authenticateAndAuthorize = (sessionId: string, operation: string, sql?: string): void => {
  const user = authManager.getUserFromSession(sessionId);
  if (!user) {
    throw new McpError(ErrorCode.InvalidRequest, 'Invalid session ID or session expired');
  }

  let permission: Permission;
  if (operation === 'mysql_query' && sql) {
    permission = authManager.parseQueryPermission(sql);
  } else {
    permission = authManager.getPermissionForOperation(operation);
  }

  if (!authManager.hasPermission(user, permission)) {
    throw new McpError(ErrorCode.InvalidRequest, `User ${user.username} does not have permission for ${permission} operation`);
  }
};

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (!mysqlClient) {
    throw new McpError(ErrorCode.InternalError, 'MySQL client not initialized');
  }

  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'mysql_auth': {
        const { username, password } = args as { username: string; password: string };
        const sessionId = authManager.authenticate(username, password);
        if (!sessionId) {
          throw new McpError(ErrorCode.InvalidRequest, 'Invalid username or password');
        }
        return {
          content: [
            {
              type: 'text',
              text: `Authentication successful. Session ID: ${sessionId}`,
            },
          ],
        };
      }
      case 'mysql_query': {
        const { session_id, query, params } = args as { session_id: string; query: string; params?: string[] };
        authenticateAndAuthorize(session_id, 'mysql_query', query);
        
        // Check cache first for read operations
        if (queryCache.shouldCache(query)) {
          const cachedResult = queryCache.get(query, params);
          if (cachedResult) {
            return {
              content: [
                {
                  type: 'text',
                  text: `[CACHED] ${JSON.stringify(cachedResult, null, 2)}`,
                },
              ],
            };
          }
        }
        
        const result = await mysqlClient.query(query, params);
        
        // Cache the result if it's a read operation
        if (queryCache.shouldCache(query)) {
          queryCache.set(query, result, params);
        }
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'mysql_list_databases': {
        const { session_id } = args as { session_id: string };
        authenticateAndAuthorize(session_id, 'mysql_list_databases');
        
        const databases = await mysqlClient.listDatabases();
        return {
          content: [
            {
              type: 'text',
              text: `Available databases:\n${databases.map(db => `- ${db}`).join('\n')}`,
            },
          ],
        };
      }

      case 'mysql_list_tables': {
        const { session_id, database } = args as { session_id: string; database?: string };
        authenticateAndAuthorize(session_id, 'mysql_list_tables');
        
        const tables = await mysqlClient.listTables(database);
        return {
          content: [
            {
              type: 'text',
              text: `Tables${database ? ` in database '${database}'` : ''}:\n${tables.map(table => `- ${table}`).join('\n')}`,
            },
          ],
        };
      }

      case 'mysql_describe_table': {
        const { session_id, table, database } = args as { session_id: string; table: string; database?: string };
        authenticateAndAuthorize(session_id, 'mysql_describe_table');
        
        const schema = await mysqlClient.describeTable(table, database);
        return {
          content: [
            {
              type: 'text',
              text: `Schema for table '${table}'${database ? ` in database '${database}'` : ''}:\n${JSON.stringify(schema, null, 2)}`,
            },
          ],
        };
      }

      case 'mysql_get_table_data': {
        const { session_id, table, limit = 100, database } = args as { session_id: string; table: string; limit?: number; database?: string };
        authenticateAndAuthorize(session_id, 'mysql_get_table_data');
        
        const data = await mysqlClient.getTableData(table, limit, database);
        return {
          content: [
            {
              type: 'text',
              text: `Data from table '${table}'${database ? ` in database '${database}'` : ''} (limit: ${limit}):\n${JSON.stringify(data, null, 2)}`,
            },
          ],
        };
      }

      case 'mysql_insert': {
        const { session_id, table, data, database } = args as { session_id: string; table: string; data: Record<string, any>; database?: string };
        authenticateAndAuthorize(session_id, 'mysql_insert');
        
        const result = await mysqlClient.insertData(table, data, database);
        // Invalidate cache for this table
        queryCache.invalidateTable(table);
        
        return {
          content: [
            {
              type: 'text',
              text: `Inserted data into table '${table}'${database ? ` in database '${database}'` : ''}:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case 'mysql_update': {
        const { session_id, table, data, where, database } = args as { session_id: string; table: string; data: Record<string, any>; where: Record<string, any>; database?: string };
        authenticateAndAuthorize(session_id, 'mysql_update');
        
        const result = await mysqlClient.updateData(table, data, where, database);
        // Invalidate cache for this table
        queryCache.invalidateTable(table);
        
        return {
          content: [
            {
              type: 'text',
              text: `Updated data in table '${table}'${database ? ` in database '${database}'` : ''}:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      case 'mysql_delete': {
        const { session_id, table, where, database } = args as { session_id: string; table: string; where: Record<string, any>; database?: string };
        authenticateAndAuthorize(session_id, 'mysql_delete');
        
        const result = await mysqlClient.deleteData(table, where, database);
        // Invalidate cache for this table
        queryCache.invalidateTable(table);
        
        return {
          content: [
            {
              type: 'text',
              text: `Deleted data from table '${table}'${database ? ` in database '${database}'` : ''}:\n${JSON.stringify(result, null, 2)}`,
            },
          ],
        };
      }

      default:
        throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
    }
  } catch (error) {
    throw new McpError(ErrorCode.InternalError, `Tool execution failed: ${error}`);
  }
});

async function runServer() {
  await initializeServices();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  // Cleanup on exit
  process.on('SIGINT', async () => {
    if (mysqlClient) {
      await mysqlClient.disconnect();
    }
    process.exit(0);
  });
}

runServer().catch((error) => {
  console.error('Server failed to start:', error);
  process.exit(1);
});