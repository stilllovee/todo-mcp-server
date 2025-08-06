/**
 * Configuration constants for the MCP Server
 */

// Hardcoded Bearer Token - In production, this should be configurable
const BEARER_TOKEN = 'your-bearer-token-here';

// Hardcoded log file path - In production, this should be configurable
const LOG_FILE_PATH = "C:\\Users\\Admin\\Downloads\\log1.txt";

// Server configuration
const SERVER_CONFIG = {
  name: 'backend-mcp-server',
  version: '1.0.0',
};

// Default paths for Node.js process management
const DEFAULT_PATHS = {
  entrypoint: 'C:\\app\\server.js',
  logFile: 'C:\\Users\\Admin\\Documents\\code\\backend-mcp-server\\node.log',
  errorLogFile: 'C:\\Users\\Admin\\Documents\\code\\backend-mcp-server\\node-error.log',
};

// Command timeouts (in milliseconds)
const TIMEOUTS = {
  curl: 30000,      // 30 seconds
  powershell: 30000, // 30 seconds
};

// File size limits
const LIMITS = {
  maxLogFileSizeMB: 100, // Maximum log file size in MB
};

module.exports = {
  BEARER_TOKEN,
  LOG_FILE_PATH,
  SERVER_CONFIG,
  DEFAULT_PATHS,
  TIMEOUTS,
  LIMITS,
};