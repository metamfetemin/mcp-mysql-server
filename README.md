# MCP MySQL Server

**Advanced MySQL MCP (Model Context Protocol) Server** with authentication, caching, and dynamic configuration support.

[![npm version](https://badge.fury.io/js/mcp-mysql.svg)](https://badge.fury.io/js/mcp-mysql)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## 🌟 Features

### 🔐 **Authentication & Authorization**
- **Role-based access control** (Admin, Read-Write, Read-Only)
- **Session-based authentication** with secure token management
- **Operation-level permission control** for granular security

### 🚀 **Smart Caching System**
- **Automatic caching** for SELECT, SHOW, and DESCRIBE queries
- **5-minute TTL** with intelligent cache management
- **Auto cache invalidation** on INSERT/UPDATE/DELETE operations
- **Memory-efficient** LRU cache with configurable size limits

### ⚡ **Dynamic Configuration**
- **Hot reload** of `.env` file changes
- **Runtime MySQL connection updates** without server restart
- **Environment variable priority** system
- **Flexible configuration** with sensible defaults

### 📊 **Complete SQL Support**
- **Full SQL operations**: SELECT, INSERT, UPDATE, DELETE, SHOW, DESCRIBE
- **Secure parameterized queries** to prevent SQL injection
- **User permission-based SQL filtering**
- **Multi-database support** with optional database specification

## 🚀 Quick Start (For Regular Users)

### 1. Installation

```bash
# Clone or download the project
git clone <repository-url>
cd mcp-mysql

# Install dependencies
npm install

# Build the project
npm run build
```

### 2. Basic Configuration

Create a `.env` file with your MySQL connection details:

```bash
# Copy the example file
cp .env.example .env
```

Edit `.env` with your MySQL credentials:

```bash
# Required: Your MySQL connection details
MYSQL_USER=your_mysql_username
MYSQL_PASSWORD=your_mysql_password

# Optional: Will use defaults if not specified
MYSQL_HOST=localhost          # Default: localhost
MYSQL_PORT=3306              # Default: 3306
MYSQL_DATABASE=your_database # Optional: can connect without specific DB
```

### 3. Start the Server

```bash
# Start the MCP server
npm start
```

### 4. Basic Usage

1. **Authenticate first** to get a session token:
   ```json
   {
     "tool": "mysql_auth",
     "arguments": {
       "username": "admin",
       "password": "admin123"
     }
   }
   ```

2. **Use the session token** for all other operations:
   ```json
   {
     "tool": "mysql_list_databases",
     "arguments": {
       "session_id": "your_session_token_here"
     }
   }
   ```

### Default User Accounts

| Username | Password | Permissions |
|----------|----------|-------------|
| `admin` | `admin123` | All operations (SELECT, INSERT, UPDATE, DELETE, SHOW, DESCRIBE) |
| `readwrite` | `rw123` | Read and write operations (SELECT, INSERT, UPDATE, SHOW, DESCRIBE) |
| `readonly` | `ro123` | Read-only operations (SELECT, SHOW, DESCRIBE) |

## 🔧 Advanced Configuration (For Power Users)

### Environment Variables Reference

```bash
# === MySQL Connection Settings ===
MYSQL_HOST=localhost                    # MySQL server hostname/IP
MYSQL_PORT=3306                        # MySQL server port
MYSQL_USER=root                        # MySQL username
MYSQL_PASSWORD=your_secure_password    # MySQL password
MYSQL_DATABASE=my_database             # Default database (optional)

# === Authentication Users (Optional) ===
# Admin user (full access)
MYSQL_ADMIN_USER=admin                 # Default: admin
MYSQL_ADMIN_PASSWORD=secure_admin_pass # Default: admin123

# Read-Write user (no DELETE permission)
MYSQL_RW_USER=readwrite               # Default: readwrite
MYSQL_RW_PASSWORD=secure_rw_pass      # Default: rw123

# Read-Only user (SELECT, SHOW, DESCRIBE only)
MYSQL_RO_USER=readonly                # Default: readonly
MYSQL_RO_PASSWORD=secure_ro_pass      # Default: ro123
```

### Customizing User Roles

You can customize the default users by setting environment variables:

```bash
# Example: Custom user setup
MYSQL_ADMIN_USER=mycompany_admin
MYSQL_ADMIN_PASSWORD=MyS3cur3P@ssw0rd!

MYSQL_RW_USER=app_writer
MYSQL_RW_PASSWORD=AppWr1ter2024

MYSQL_RO_USER=analyst
MYSQL_RO_PASSWORD=R3adOnly2024
```

### Cache Configuration

The caching system can be configured programmatically by modifying the `QueryCache` initialization in `src/index.ts`:

```typescript
// Default: 1000 entries, 5-minute TTL
queryCache = new QueryCache(1000, 5 * 60 * 1000);

// Custom: 5000 entries, 10-minute TTL
queryCache = new QueryCache(5000, 10 * 60 * 1000);
```

### Security Best Practices

1. **Change default passwords** in production:
   ```bash
   MYSQL_ADMIN_PASSWORD=YourVerySecurePassword123!
   MYSQL_RW_PASSWORD=AnotherSecurePassword456!
   MYSQL_RO_PASSWORD=ReadOnlySecurePass789!
   ```

2. **Use strong MySQL credentials**:
   ```bash
   MYSQL_USER=dedicated_mcp_user
   MYSQL_PASSWORD=VeryLongAndSecurePassword123!
   ```

3. **Limit database access** by specifying a dedicated database:
   ```bash
   MYSQL_DATABASE=mcp_allowed_database
   ```

## 🌐 Remote MySQL Server Setup

### AWS RDS Configuration

```bash
# AWS RDS MySQL instance
MYSQL_HOST=your-rds-instance.cluster-xyz.us-east-1.rds.amazonaws.com
MYSQL_PORT=3306
MYSQL_USER=your_rds_username
MYSQL_PASSWORD=your_rds_password
MYSQL_DATABASE=your_database_name
```

### Google Cloud SQL Configuration

```bash
# Google Cloud SQL MySQL instance
MYSQL_HOST=your-project:region:instance-name
MYSQL_PORT=3306
MYSQL_USER=your_cloudsql_user
MYSQL_PASSWORD=your_cloudsql_password
MYSQL_DATABASE=your_database
```

### Azure Database for MySQL

```bash
# Azure Database for MySQL
MYSQL_HOST=your-server.mysql.database.azure.com
MYSQL_PORT=3306
MYSQL_USER=your_username@your-server
MYSQL_PASSWORD=your_azure_password
MYSQL_DATABASE=your_database
```

### Docker MySQL Container

```bash
# Local Docker MySQL
MYSQL_HOST=localhost
MYSQL_PORT=3307  # If using custom port mapping
MYSQL_USER=root
MYSQL_PASSWORD=docker_mysql_password
MYSQL_DATABASE=docker_db

# Docker Compose with custom network
MYSQL_HOST=mysql_container_name
MYSQL_PORT=3306
MYSQL_USER=compose_user
MYSQL_PASSWORD=compose_password
```

### SSH Tunnel Configuration

For servers behind SSH tunnels, set up port forwarding first:

```bash
# Terminal 1: Create SSH tunnel
ssh -L 3307:localhost:3306 user@remote-server.com

# Terminal 2: Configure MCP to use tunnel
MYSQL_HOST=localhost
MYSQL_PORT=3307
MYSQL_USER=remote_mysql_user
MYSQL_PASSWORD=remote_mysql_password
```

### SSL/TLS Connections

For SSL connections, you may need to modify the `MySQLClient` in `src/mysql-client.ts`:

```typescript
// Add SSL configuration
this.connection = await mysql.createConnection({
  host: this.config.host,
  port: this.config.port,
  user: this.config.user,
  password: this.config.password,
  database: this.config.database,
  ssl: {
    rejectUnauthorized: false, // For self-signed certificates
    // ca: fs.readFileSync('path/to/ca-cert.pem'),
    // key: fs.readFileSync('path/to/client-key.pem'),
    // cert: fs.readFileSync('path/to/client-cert.pem'),
  }
});
```

## 🛠 Available Tools & API Reference

### Authentication

#### `mysql_auth`
Authenticate user and receive a session token.

**Parameters:**
- `username` (string, required): Username for authentication
- `password` (string, required): Password for authentication

**Response:**
- Success: Session ID string
- Error: Invalid credentials message

**Example:**
```json
{
  "tool": "mysql_auth",
  "arguments": {
    "username": "admin",
    "password": "admin123"
  }
}
```

### Database Operations

> **Note:** All database operations require a valid `session_id` from authentication.

#### `mysql_list_databases`
List all available databases on the MySQL server.

**Parameters:**
- `session_id` (string, required): Authentication session token

**Example:**
```json
{
  "tool": "mysql_list_databases",
  "arguments": {
    "session_id": "abc123xyz"
  }
}
```

#### `mysql_list_tables`
List all tables in a specific database.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `database` (string, optional): Database name (uses current/default database if not specified)

**Example:**
```json
{
  "tool": "mysql_list_tables",
  "arguments": {
    "session_id": "abc123xyz",
    "database": "my_database"
  }
}
```

#### `mysql_describe_table`
Get the structure/schema of a specific table.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `table` (string, required): Table name to describe
- `database` (string, optional): Database name

**Example:**
```json
{
  "tool": "mysql_describe_table",
  "arguments": {
    "session_id": "abc123xyz",
    "table": "users",
    "database": "my_app"
  }
}
```

### Data Operations

#### `mysql_query`
Execute raw SQL queries with automatic permission checking and caching.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `query` (string, required): SQL query to execute
- `params` (array, optional): Parameters for prepared statements

**Supported Query Types by Role:**
- **Admin**: All query types
- **Read-Write**: SELECT, INSERT, UPDATE, SHOW, DESCRIBE
- **Read-Only**: SELECT, SHOW, DESCRIBE

**Examples:**
```json
// Simple SELECT
{
  "tool": "mysql_query",
  "arguments": {
    "session_id": "abc123xyz",
    "query": "SELECT * FROM users LIMIT 10"
  }
}

// Parameterized query
{
  "tool": "mysql_query",
  "arguments": {
    "session_id": "abc123xyz",
    "query": "SELECT * FROM users WHERE age > ? AND city = ?",
    "params": ["25", "New York"]
  }
}

// INSERT query
{
  "tool": "mysql_query",
  "arguments": {
    "session_id": "abc123xyz",
    "query": "INSERT INTO users (name, email, age) VALUES (?, ?, ?)",
    "params": ["John Doe", "john@example.com", "30"]
  }
}
```

#### `mysql_get_table_data`
Retrieve data from a specific table with optional row limiting.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `table` (string, required): Table name to query
- `limit` (number, optional): Maximum number of rows to return (default: 100, max: 1000)
- `database` (string, optional): Database name

**Example:**
```json
{
  "tool": "mysql_get_table_data",
  "arguments": {
    "session_id": "abc123xyz",
    "table": "products",
    "limit": 50,
    "database": "ecommerce"
  }
}
```

#### `mysql_insert`
Insert data into a table using key-value pairs.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `table` (string, required): Table name to insert into
- `data` (object, required): Data to insert as key-value pairs
- `database` (string, optional): Database name

**Example:**
```json
{
  "tool": "mysql_insert",
  "arguments": {
    "session_id": "abc123xyz",
    "table": "users",
    "data": {
      "name": "Alice Smith",
      "email": "alice@example.com",
      "age": 28,
      "city": "San Francisco"
    },
    "database": "my_app"
  }
}
```

#### `mysql_update`
Update existing records in a table.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `table` (string, required): Table name to update
- `data` (object, required): Data to update as key-value pairs
- `where` (object, required): WHERE conditions as key-value pairs
- `database` (string, optional): Database name

**Example:**
```json
{
  "tool": "mysql_update",
  "arguments": {
    "session_id": "abc123xyz",
    "table": "users",
    "data": {
      "email": "newemail@example.com",
      "age": 29
    },
    "where": {
      "id": 123
    },
    "database": "my_app"
  }
}
```

#### `mysql_delete`
Delete records from a table.

**Parameters:**
- `session_id` (string, required): Authentication session token
- `table` (string, required): Table name to delete from
- `where` (object, required): WHERE conditions as key-value pairs
- `database` (string, optional): Database name

**Example:**
```json
{
  "tool": "mysql_delete",
  "arguments": {
    "session_id": "abc123xyz",
    "table": "users",
    "where": {
      "id": 123,
      "status": "inactive"
    },
    "database": "my_app"
  }
}
```

## 🔧 Development & Customization

### Project Structure

```
mcp-mysql/
├── src/
│   ├── index.ts           # Main MCP server implementation
│   ├── mysql-client.ts    # MySQL connection and query handling
│   ├── auth.ts            # Authentication and authorization
│   ├── cache.ts           # Query caching system
│   └── config-watcher.ts  # Dynamic configuration management
├── dist/                  # Compiled JavaScript output
├── .env                   # Environment configuration
├── .env.example          # Configuration template
└── README.md             # This file
```

### Development Commands

```bash
# Development mode (with auto-reload)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Clean build directory
npm run clean

# Run linting
npm run lint
```

### Adding Custom SQL Operations

To add new SQL operations, modify `src/index.ts`:

1. Add the tool definition to the `tools` array in `ListToolsRequestSchema`
2. Add the corresponding case in the `CallToolRequestSchema` handler
3. Implement the logic in `src/mysql-client.ts` if needed

### Extending Authentication

To add custom authentication methods, modify `src/auth.ts`:

1. Extend the `UserRole` enum for new roles
2. Add new permissions to the `Permission` enum
3. Update the `hasPermission` method logic
4. Modify `initializeDefaultUsers` for custom user setup

### Custom Cache Strategies

Modify `src/cache.ts` to implement custom caching strategies:

1. Adjust TTL values for different query types
2. Implement custom cache key generation
3. Add cache warming strategies
4. Implement distributed caching (Redis, etc.)

## 🔌 Claude Desktop Integration

### Configuration File Locations

The `claude_desktop_config.json` file is located in different places depending on your operating system:

#### 🍎 **macOS**
```bash
~/Library/Application Support/Claude/claude_desktop_config.json
```

#### 🪟 **Windows**
```bash
%APPDATA%\Claude\claude_desktop_config.json
```
Or typically:
```bash
C:\Users\YourUsername\AppData\Roaming\Claude\claude_desktop_config.json
```

#### 🐧 **Linux (Ubuntu/Debian)**
```bash
~/.config/Claude/claude_desktop_config.json
```

### Step-by-Step Setup Guide

#### 1. Locate Your Config File

**macOS:**
```bash
# Check if file exists
ls ~/Library/Application\ Support/Claude/claude_desktop_config.json

# If directory doesn't exist, create it
mkdir -p ~/Library/Application\ Support/Claude/
```

**Windows (Command Prompt):**
```cmd
# Check if file exists
dir "%APPDATA%\Claude\claude_desktop_config.json"

# If directory doesn't exist, create it
mkdir "%APPDATA%\Claude"
```

**Linux:**
```bash
# Check if file exists
ls ~/.config/Claude/claude_desktop_config.json

# If directory doesn't exist, create it
mkdir -p ~/.config/Claude/
```

#### 2. Get Your Project Path

First, get the absolute path to your mcp-mysql project:

```bash
# Navigate to your project directory
cd /Users/ahmeteminersoy/Documents/src/src-git-mit

# Get the absolute path
pwd
```

Copy the output path for use in the configuration.

#### 3. Create or Edit Configuration File

Add this configuration to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-mysql": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_mysql_user",
        "MYSQL_PASSWORD": "your_mysql_password",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "your_admin_password",
        "MYSQL_RW_USER": "readwrite", 
        "MYSQL_RW_PASSWORD": "your_rw_password",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "your_ro_password"
      }
    }
  }
}
```

#### 4. Platform-Specific Examples

**macOS Example:**
```json
{
  "mcpServers": {
    "mcp-mysql": {
      "command": "node",
      "args": ["/Users/ahmeteminersoy/Documents/src/src-git-mit/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "12345678",
        "MYSQL_DATABASE": "odiapp",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "mcp-mysql": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\Documents\\mcp-mysql\\dist\\index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

**Linux Example:**
```json
{
  "mcpServers": {
    "mcp-mysql": {
      "command": "node",
      "args": ["/home/username/projects/mcp-mysql/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

### 5. Quick Setup Commands

#### macOS:
```bash
# Navigate to your project
cd /Users/ahmeteminersoy/Documents/src/src-git-mit

# Build the project
npm run build

# Create Claude config directory if it doesn't exist
mkdir -p ~/Library/Application\ Support/Claude/

# Edit the config file (creates if doesn't exist)
nano ~/Library/Application\ Support/Claude/claude_desktop_config.json
```

#### Windows (PowerShell):
```powershell
# Navigate to your project
cd C:\path\to\your\mcp-mysql

# Build the project
npm run build

# Create Claude config directory if it doesn't exist
New-Item -ItemType Directory -Force -Path "$env:APPDATA\Claude"

# Edit the config file
notepad "$env:APPDATA\Claude\claude_desktop_config.json"
```

#### Linux:
```bash
# Navigate to your project
cd /path/to/your/mcp-mysql

# Build the project
npm run build

# Create Claude config directory if it doesn't exist
mkdir -p ~/.config/Claude/

# Edit the config file
nano ~/.config/Claude/claude_desktop_config.json
```

### 6. Restart Claude Desktop

After saving the configuration file:

1. **Completely quit Claude Desktop** (not just close the window)
   - **macOS:** Cmd+Q or Claude Desktop → Quit Claude Desktop
   - **Windows:** Right-click on system tray icon → Exit
   - **Linux:** Close application completely

2. **Restart Claude Desktop**

3. **Verify Integration:** You should see the MySQL tools available in Claude Desktop

### Alternative: Using Environment Variables

Instead of hardcoding credentials in the config file, you can use environment variables:

```json
{
  "mcpServers": {
    "mcp-mysql": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/dist/index.js"],
      "env": {
        "MYSQL_HOST": "${MYSQL_HOST}",
        "MYSQL_PORT": "${MYSQL_PORT}",
        "MYSQL_USER": "${MYSQL_USER}",
        "MYSQL_PASSWORD": "${MYSQL_PASSWORD}",
        "MYSQL_DATABASE": "${MYSQL_DATABASE}"
      }
    }
  }
}
```

Then set the environment variables in your system.

### 7. Testing the Integration

Once configured, you can test the integration in Claude Desktop:

1. Start a new conversation
2. You should see MySQL tools available
3. Try authenticating:
   ```
   Use the mysql_auth tool with username "admin" and password "admin123"
   ```
4. Then try listing databases:
   ```
   Use mysql_list_databases with the session_id you received
   ```

### 8. Common Integration Issues

#### Node.js Not Found
```bash
Error: spawn node ENOENT
```
**Solution:** Ensure Node.js is installed and in your PATH:
```bash
# Check Node.js installation
node --version

# If not installed, install Node.js from https://nodejs.org
```

#### Permission Denied
```bash
Error: EACCES: permission denied
```
**Solution:** Check file permissions:
```bash
# Make sure the project files are readable
chmod -R 755 /path/to/your/mcp-mysql

# Ensure the index.js file is executable
chmod +x /path/to/your/mcp-mysql/dist/index.js
```

#### Invalid Configuration
```bash
Error: Invalid MCP configuration
```
**Solution:** Validate your JSON configuration:
1. Use a JSON validator to check syntax
2. Ensure all paths use forward slashes (even on Windows in JSON)
3. Escape backslashes in Windows paths: `"C:\\\\Users\\\\..."`

## 💻 Claude CLI Integration

Claude CLI uses a different configuration system than Claude Desktop. Here's how to set up MCP MySQL for Claude CLI:

### CLI Configuration File Locations

#### 🍎 **macOS**
```bash
~/.config/claude/config.json
```
or
```bash
~/.claude/config.json
```

#### 🪟 **Windows**
```bash
%USERPROFILE%\.claude\config.json
```
or
```bash
C:\Users\YourUsername\.claude\config.json
```

#### 🐧 **Linux (Ubuntu/Debian)**
```bash
~/.config/claude/config.json
```
or
```bash
~/.claude/config.json
```

### Step-by-Step CLI Setup

#### 1. Check Claude CLI Installation

```bash
# Verify Claude CLI is installed
claude --version

# If not installed, install it
npm install -g @anthropic-ai/claude-cli
# or
pip install claude-cli
```

#### 2. Create CLI Configuration Directory

**macOS/Linux:**
```bash
# Create config directory
mkdir -p ~/.config/claude/

# Or alternative location
mkdir -p ~/.claude/
```

**Windows (PowerShell):**
```powershell
# Create config directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude"
```

#### 3. Create CLI Configuration File

Create `~/.config/claude/config.json` (or `~/.claude/config.json`):

```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/absolute/path/to/your/project/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "your_mysql_user",
        "MYSQL_PASSWORD": "your_mysql_password",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

#### 4. Platform-Specific CLI Examples

**macOS Example:**
```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/Users/ahmeteminersoy/Documents/src/src-git-mit/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "12345678",
        "MYSQL_DATABASE": "odiapp",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

**Windows Example:**
```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\Documents\\mcp-mysql\\dist\\index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

**Linux Example:**
```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/home/username/projects/mcp-mysql/dist/index.js"],
      "env": {
        "MYSQL_HOST": "localhost",
        "MYSQL_PORT": "3306",
        "MYSQL_USER": "root",
        "MYSQL_PASSWORD": "your_password",
        "MYSQL_DATABASE": "your_database",
        "MYSQL_ADMIN_USER": "admin",
        "MYSQL_ADMIN_PASSWORD": "admin123",
        "MYSQL_RW_USER": "readwrite",
        "MYSQL_RW_PASSWORD": "rw123",
        "MYSQL_RO_USER": "readonly",
        "MYSQL_RO_PASSWORD": "ro123"
      }
    }
  }
}
```

### 5. Quick CLI Setup Commands

#### macOS:
```bash
# Navigate to your project
cd /Users/ahmeteminersoy/Documents/src/src-git-mit

# Ensure project is built
npm run build

# Create Claude CLI config directory
mkdir -p ~/.config/claude/

# Create config file with nano
nano ~/.config/claude/config.json

# Test Claude CLI
claude --help
```

#### Windows (PowerShell):
```powershell
# Navigate to your project
cd C:\path\to\your\mcp-mysql

# Ensure project is built
npm run build

# Create Claude CLI config directory
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.claude"

# Create config file
notepad "$env:USERPROFILE\.claude\config.json"

# Test Claude CLI
claude --help
```

#### Linux:
```bash
# Navigate to your project
cd /path/to/your/mcp-mysql

# Ensure project is built
npm run build

# Create Claude CLI config directory
mkdir -p ~/.config/claude/

# Create config file
nano ~/.config/claude/config.json

# Test Claude CLI
claude --help
```

### 6. Using Claude CLI with MCP

#### Method 1: Auto-load from Config
```bash
# Claude CLI will automatically load MCP servers from config
claude

# In the CLI session, you can use MySQL tools
> Use mysql_auth with username "admin" and password "admin123"
```

#### Method 2: Specify MCP Server Manually
```bash
# Start Claude CLI with specific MCP server
claude --mcp-server /Users/ahmeteminersoy/Documents/src/src-git-mit/dist/index.js

# Or with environment variables
MYSQL_HOST=localhost MYSQL_USER=root claude --mcp-server ./dist/index.js
```

#### Method 3: Start MCP Server Separately
```bash
# Terminal 1: Start MCP server
cd /Users/ahmeteminersoy/Documents/src/src-git-mit
npm start

# Terminal 2: Start Claude CLI and connect
claude --connect-mcp localhost:stdio
```

### 7. Testing CLI Integration

```bash
# Start Claude CLI
claude

# Test the MySQL tools
> List available tools

# You should see mysql_auth, mysql_query, etc.

# Test authentication
> Use mysql_auth tool with username "admin" and password "admin123"

# Test database listing
> Use mysql_list_databases with the session_id you received
```

### 8. CLI-Specific Troubleshooting

#### Claude CLI Not Found
```bash
Error: command not found: claude
```
**Solution:** Install Claude CLI:
```bash
# Using npm
npm install -g @anthropic-ai/claude-cli

# Using pip
pip install claude-cli

# Using homebrew (macOS)
brew install claude-cli
```

#### Config File Not Found
```bash
Error: No configuration file found
```
**Solution:** Create config file in the correct location:
```bash
# Check expected location
claude --help | grep config

# Create in standard location
mkdir -p ~/.config/claude/
touch ~/.config/claude/config.json
```

#### MCP Server Connection Failed
```bash
Error: Failed to connect to MCP server
```
**Solutions:**
1. **Verify project is built:**
   ```bash
   cd /path/to/mcp-mysql
   npm run build
   ls dist/index.js  # Should exist
   ```

2. **Check Node.js path in config:**
   ```bash
   which node  # Use this path in config if needed
   ```

3. **Test MCP server manually:**
   ```bash
   node /path/to/dist/index.js
   ```

#### Permission Issues
```bash
Error: EACCES: permission denied
```
**Solution:**
```bash
# Fix file permissions
chmod +x /path/to/dist/index.js
chmod -R 755 /path/to/mcp-mysql/
```

### 9. CLI vs Desktop Differences

| Feature | Claude Desktop | Claude CLI |
|---------|----------------|------------|
| **Config File** | `claude_desktop_config.json` | `config.json` |
| **Auto-start** | ✅ Automatic | ✅ Automatic (with config) |
| **Manual start** | ❌ Not supported | ✅ `--mcp-server` flag |
| **Environment** | GUI | Terminal |
| **Hot reload** | ✅ Restart required | ✅ Restart required |

### 10. Advanced CLI Configuration

#### Multiple MCP Servers
```json
{
  "mcpServers": {
    "mysql": {
      "command": "node",
      "args": ["/path/to/mysql-mcp/dist/index.js"],
      "env": { "MYSQL_HOST": "localhost" }
    },
    "postgres": {
      "command": "node", 
      "args": ["/path/to/postgres-mcp/dist/index.js"],
      "env": { "POSTGRES_HOST": "localhost" }
    }
  }
}
```

#### Environment-Specific Configs
```bash
# Development config
claude --config ~/.config/claude/dev-config.json

# Production config  
claude --config ~/.config/claude/prod-config.json
```

## 🚨 Troubleshooting

### Common Issues

#### Connection Refused
```bash
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solution:** Check if MySQL server is running and accessible:
```bash
# Test MySQL connection
mysql -h localhost -P 3306 -u your_user -p

# Check MySQL service status
sudo systemctl status mysql  # Linux
brew services list | grep mysql  # macOS
```

#### Authentication Failed
```bash
Error: Access denied for user 'username'@'localhost'
```
**Solutions:**
1. Verify credentials in `.env` file
2. Check MySQL user permissions:
   ```sql
   SHOW GRANTS FOR 'your_user'@'localhost';
   ```
3. Create user with proper permissions:
   ```sql
   CREATE USER 'mcp_user'@'localhost' IDENTIFIED BY 'secure_password';
   GRANT ALL PRIVILEGES ON your_database.* TO 'mcp_user'@'localhost';
   FLUSH PRIVILEGES;
   ```

#### Permission Denied for Operations
```bash
Error: User readonly does not have permission for insert operation
```
**Solution:** Use appropriate user role or authenticate with a user that has the required permissions.

#### Cache Issues
If you experience stale data, you can clear the cache by:
1. Restarting the server
2. Performing any INSERT/UPDATE/DELETE operation (auto-clears related cache)
3. Modifying the `.env` file (triggers full cache clear)

### Debug Mode

Enable debug logging by setting the environment variable:
```bash
DEBUG=mcp-mysql npm start
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

- **Issues:** [GitHub Issues](https://github.com/your-username/mcp-mysql/issues)
- **Discussions:** [GitHub Discussions](https://github.com/your-username/mcp-mysql/discussions)
- **Email:** your-email@example.com

---

**Happy coding! 🚀**
