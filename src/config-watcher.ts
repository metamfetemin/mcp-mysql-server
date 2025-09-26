import { readFileSync, watchFile } from 'fs';
import { join } from 'path';

export interface Config {
  MYSQL_HOST: string;
  MYSQL_PORT: number;
  MYSQL_USER: string;
  MYSQL_PASSWORD: string;
  MYSQL_DATABASE?: string;
  MYSQL_ADMIN_USER?: string;
  MYSQL_ADMIN_PASSWORD?: string;
  MYSQL_RW_USER?: string;
  MYSQL_RW_PASSWORD?: string;
  MYSQL_RO_USER?: string;
  MYSQL_RO_PASSWORD?: string;
}

export class ConfigWatcher {
  private config: Config;
  private envFilePath: string;
  private listeners: Array<(config: Config) => void> = [];

  constructor(envPath?: string) {
    this.envFilePath = envPath || join(process.cwd(), '.env');
    this.config = this.loadConfig();
    this.startWatching();
  }

  private parseEnvFile(): Record<string, string> {
    const env: Record<string, string> = {};
    
    try {
      const envFile = readFileSync(this.envFilePath, 'utf8');
      const lines = envFile.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            env[key.trim()] = valueParts.join('=').trim();
          }
        }
      }
    } catch (error) {
      console.warn('Could not read .env file:', error);
    }
    
    return env;
  }

  private loadConfig(): Config {
    // First load from .env file
    const envVars = this.parseEnvFile();
    
    // Then merge with process.env (process.env takes precedence)
    const merged = { ...envVars, ...process.env };
    
    return {
      MYSQL_HOST: merged.MYSQL_HOST || 'localhost',
      MYSQL_PORT: parseInt(merged.MYSQL_PORT || '3306'),
      MYSQL_USER: merged.MYSQL_USER || 'root',
      MYSQL_PASSWORD: merged.MYSQL_PASSWORD || '',
      MYSQL_DATABASE: merged.MYSQL_DATABASE,
      MYSQL_ADMIN_USER: merged.MYSQL_ADMIN_USER,
      MYSQL_ADMIN_PASSWORD: merged.MYSQL_ADMIN_PASSWORD,
      MYSQL_RW_USER: merged.MYSQL_RW_USER,
      MYSQL_RW_PASSWORD: merged.MYSQL_RW_PASSWORD,
      MYSQL_RO_USER: merged.MYSQL_RO_USER,
      MYSQL_RO_PASSWORD: merged.MYSQL_RO_PASSWORD,
    };
  }

  private startWatching(): void {
    watchFile(this.envFilePath, { interval: 1000 }, () => {
      console.log('Config file changed, reloading...');
      const oldConfig = { ...this.config };
      this.config = this.loadConfig();
      
      // Notify listeners if config actually changed
      if (JSON.stringify(oldConfig) !== JSON.stringify(this.config)) {
        this.notifyListeners();
      }
    });
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.config);
      } catch (error) {
        console.error('Error in config change listener:', error);
      }
    }
  }

  getConfig(): Config {
    return { ...this.config };
  }

  onChange(listener: (config: Config) => void): void {
    this.listeners.push(listener);
  }

  removeListener(listener: (config: Config) => void): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  updateProcessEnv(): void {
    // Update process.env with current config
    process.env.MYSQL_HOST = this.config.MYSQL_HOST;
    process.env.MYSQL_PORT = this.config.MYSQL_PORT.toString();
    process.env.MYSQL_USER = this.config.MYSQL_USER;
    process.env.MYSQL_PASSWORD = this.config.MYSQL_PASSWORD;
    if (this.config.MYSQL_DATABASE) {
      process.env.MYSQL_DATABASE = this.config.MYSQL_DATABASE;
    }
    if (this.config.MYSQL_ADMIN_USER) {
      process.env.MYSQL_ADMIN_USER = this.config.MYSQL_ADMIN_USER;
    }
    if (this.config.MYSQL_ADMIN_PASSWORD) {
      process.env.MYSQL_ADMIN_PASSWORD = this.config.MYSQL_ADMIN_PASSWORD;
    }
    if (this.config.MYSQL_RW_USER) {
      process.env.MYSQL_RW_USER = this.config.MYSQL_RW_USER;
    }
    if (this.config.MYSQL_RW_PASSWORD) {
      process.env.MYSQL_RW_PASSWORD = this.config.MYSQL_RW_PASSWORD;
    }
    if (this.config.MYSQL_RO_USER) {
      process.env.MYSQL_RO_USER = this.config.MYSQL_RO_USER;
    }
    if (this.config.MYSQL_RO_PASSWORD) {
      process.env.MYSQL_RO_PASSWORD = this.config.MYSQL_RO_PASSWORD;
    }
  }
}