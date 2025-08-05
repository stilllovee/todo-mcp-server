#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');

const execAsync = promisify(exec);

// Hardcoded Bearer Token - In production, this should be configurable
const BEARER_TOKEN = 'your-bearer-token-here';

// Hardcoded log file path - In production, this should be configurable
const LOG_FILE_PATH = "C:\\Users\\Admin\\Downloads\\log1.txt";

class CurlMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'backend-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize SQLite database for task management
    this.dbPath = path.join(__dirname, 'tasks.db');
    this.db = new sqlite3.Database(this.dbPath);
    this.initializeDatabase();

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  /**
   * Initialize SQLite database for task management
   */
  initializeDatabase() {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS tasks (
        task_id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;

    this.db.run(createTableSQL, (err) => {
      if (err) {
        console.error('[MCP Server] Error creating tasks table:', err);
      } else {
        console.error('[MCP Server] Tasks database initialized');
      }
    });
  }

  setupToolHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'execute_curl',
            description: 'Execute a curl command with automatic Bearer token injection and PowerShell compatibility',
            inputSchema: {
              type: 'object',
              properties: {
                command: {
                  type: 'string',
                  description: 'The curl command to execute',
                },
              },
              required: ['command'],
            },
          },
          {
            name: 'restart_node_process',
            description: 'Kill any process using port 3000 and start a new Node.js process in the background',
            inputSchema: {
              type: 'object',
              properties: {
                entrypoint: {
                  type: 'string',
                  description: 'Path to the Node.js entrypoint file (optional, uses hardcoded default)',
                },
                logFile: {
                  type: 'string',
                  description: 'Path to the log file (optional, uses hardcoded default)',
                },
                errorLogFile: {
                  type: 'string',
                  description: 'Path to the error log file (optional, uses hardcoded default)',
                },
              },
              required: [],
            },
          },
          {
            name: 'read_logs',
            description: 'Read logs from a hardcoded log file with different modes (head, tail, full, middle)',
            inputSchema: {
              type: 'object',
              properties: {
                mode: {
                  type: 'string',
                  description: 'Reading mode: "head:<n>" (first n lines), "tail:<n>" (last n lines), "full" (entire file), "middle:<n>" (n lines from middle)',
                },
              },
              required: ['mode'],
            },
          },
          // ...existing code...
          {
            name: 'list',
            description: 'Retrieve all existing tasks of the current session.',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'The session identifier for the task, generated randomly string and passed by the Agent',
                },
              },
              required: ['session_id'],
            },
          },
          {
            name: 'add',
            description: 'Add a new task to the current session\'s list.',
            inputSchema: {
              type: 'object',
              properties: {
                session_id: {
                  type: 'string',
                  description: 'The session identifier for the task, generated randomly string and passed by the Agent',
                },
                title: {
                  type: 'string',
                  description: 'The task title',
                },
                description: {
                  type: 'string',
                  description: 'The task description (optional)',
                },
              },
              required: ['session_id', 'title'],
            },
          },
          {
            name: 'remove',
            description: 'Remove a task from the list by its task_id.',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'string',
                  description: 'The unique identifier of the task to remove',
                },
              },
              required: ['task_id'],
            },
          },
          {
            name: 'complete',
            description: 'Mark a task as completed.',
            inputSchema: {
              type: 'object',
              properties: {
                task_id: {
                  type: 'string',
                  description: 'The unique identifier of the task to mark as completed',
                },
              },
              required: ['task_id'],
            },
          },
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'execute_curl') {
        return await this.executeCurl(args.command);
      }

      if (name === 'restart_node_process') {
        return await this.restartNodeProcess(args);
      }

      if (name === 'read_logs') {
        return await this.readLogs(args.mode);
      }

      // ...existing code...

      if (name === 'list') {
        return await this.listTasks(args.session_id);
      }

      if (name === 'add') {
        return await this.addTask(args.session_id, args.title, args.description);
      }

      if (name === 'remove') {
        return await this.removeTask(args.task_id);
      }

      if (name === 'complete') {
        return await this.completeTask(args.task_id);
      }

      throw new Error(`Unknown tool: ${name}`);
    });
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  /**
   * Modify curl command to add Bearer token and make it PowerShell compatible
   */
  modifyCurlCommand(curlCommand) {
    let modifiedCommand = curlCommand.trim();

    // Ensure it starts with curl
    if (!modifiedCommand.toLowerCase().startsWith('curl')) {
      throw new Error('Command must start with curl');
    }

    // Add Bearer token if not already present
    if (!modifiedCommand.includes('Authorization:') && !modifiedCommand.includes('authorization:')) {
      // Find a good place to insert the header
      // Look for existing -H headers to insert near them, or add before the URL
      const headerRegex = /-H\s+["']([^"']+)["']/g;
      const hasHeaders = headerRegex.test(modifiedCommand);

      if (hasHeaders) {
        // Insert after the last -H header
        const lastHeaderMatch = [...modifiedCommand.matchAll(/-H\s+["']([^"']+)["']/g)].pop();
        if (lastHeaderMatch) {
          const insertPos = lastHeaderMatch.index + lastHeaderMatch[0].length;
          modifiedCommand =
            modifiedCommand.slice(0, insertPos) +
            ` -H "Authorization: Bearer ${BEARER_TOKEN}"` +
            modifiedCommand.slice(insertPos);
        }
      } else {
        // No existing headers, add before the URL (typically the last argument)
        const parts = modifiedCommand.split(' ');
        const curlIndex = parts.findIndex(part => part.toLowerCase() === 'curl');
        
        // Insert the header after 'curl' and before the URL
        // URL is typically the last argument that doesn't start with -
        let urlIndex = parts.length - 1;
        for (let i = parts.length - 1; i > curlIndex; i--) {
          if (!parts[i].startsWith('-') && parts[i].trim() !== '') {
            urlIndex = i;
            break;
          }
        }
        
        parts.splice(urlIndex, 0, '-H', `"Authorization: Bearer ${BEARER_TOKEN}"`);
        modifiedCommand = parts.join(' ');
      }
    }

    // Make PowerShell compatible
    // On Windows, we might need to use curl.exe to avoid PowerShell aliases
    // Only do this on Windows platform
    if (process.platform === 'win32') {
      modifiedCommand = modifiedCommand.replace(/^curl\b/, 'curl.exe');
    }

    // Fix quoting for PowerShell - ensure double quotes are properly escaped
    // PowerShell handles single quotes differently, so convert to double quotes
    modifiedCommand = modifiedCommand.replace(/'/g, '"');

    return modifiedCommand;
  }

  /**
   * Execute the modified curl command
   */
  async executeCurl(originalCommand) {
    try {
      // Modify the curl command
      const modifiedCommand = this.modifyCurlCommand(originalCommand);

      console.log('[MCP Server] Original command:', originalCommand);
      console.log('[MCP Server] Modified command:', modifiedCommand);

      // Execute the command
      const { stdout, stderr } = await execAsync(modifiedCommand, {
        timeout: 30000, // 30 second timeout
        encoding: 'utf8',
      });

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              originalCommand,
              modifiedCommand,
              stdout: stdout || '',
              stderr: stderr || '',
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              originalCommand,
              error: error.message,
              stdout: error.stdout || '',
              stderr: error.stderr || '',
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Kill any process using port 3000 and start a new Node.js process
   */
  async restartNodeProcess(args = {}) {
    try {
      // Hardcoded paths as requested
      const entrypoint = args.entrypoint || 'C:\\app\\server.js';
      const logFile = args.logFile || 'C:\\Users\\Admin\\Documents\\code\\backend-mcp-server\\node.log';
      const errorLogFile = args.errorLogFile || 'C:\\Users\\Admin\\Documents\\code\\backend-mcp-server\\node-error.log';

      console.log('[MCP Server] Restarting Node.js process...');
      console.log('[MCP Server] Entrypoint:', entrypoint);
      console.log('[MCP Server] Log file:', logFile);
      console.log('[MCP Server] Error log file:', errorLogFile);

      // Step 1: Kill any process using port 3000
      const killCommand = `npx kill-port 3000`;

      const killResult = await this.executePowerShellCommand(killCommand);
      console.log('[MCP Server] Kill command result:', killResult);

      // Step 2: Start a new Node.js process
      const startCommand = `Start-Process node "${entrypoint}" -RedirectStandardOutput "${logFile}" -RedirectStandardError "${errorLogFile}"`;
      this.executePowerShellCommand(startCommand).catch((error) => {
        console.error('[MCP Server] Failed to start Node.js process:', error);
      });
      console.log('[MCP Server] Start command result:');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              entrypoint,
              logFile,
              errorLogFile,
              killStep: {
                command: killCommand,
                output: killResult.stdout,
                error: killResult.stderr,
              },
              startStep: {
                command: startCommand,
                output: "oke",
                error: "",
              },
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in restartNodeProcess:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: error.message,
              stack: error.stack,
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Execute a PowerShell command using child_process.spawn
   */
  async executePowerShellCommand(command) {
    return new Promise((resolve, reject) => {
      console.log('[MCP Server] Executing PowerShell command:', command);

      // Check if we're on Windows platform
      if (process.platform !== 'win32') {
        const message = `PowerShell commands are only supported on Windows platform. Current platform: ${process.platform}`;
        console.log('[MCP Server]', message);
        resolve({
          exitCode: -1,
          stdout: '',
          stderr: message,
        });
        return;
      }

      const powershell = spawn('powershell.exe', ['-Command', command], {
        stdio: ['pipe', 'pipe', 'pipe'],
        windowsHide: true,
      });

      let stdout = '';
      let stderr = '';

      powershell.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      powershell.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      powershell.on('close', (code) => {
        console.log('[MCP Server] PowerShell command exit code:', code);
        console.log('[MCP Server] PowerShell stdout:', stdout);
        console.log('[MCP Server] PowerShell stderr:', stderr);

        resolve({
          exitCode: code,
          stdout: stdout.trim(),
          stderr: stderr.trim(),
        });
      });

      powershell.on('error', (error) => {
        console.error('[MCP Server] PowerShell command error:', error);
        reject(error);
      });

      // Set a timeout for the PowerShell command
      setTimeout(() => {
        powershell.kill();
        reject(new Error('PowerShell command timed out after 30 seconds'));
      }, 30000);
    });
  }

  /**
   * Parse the mode parameter to extract command and number
   */
  parseMode(mode) {
    if (mode === 'full') {
      return { command: 'full', number: null };
    }

    const modePattern = /^(head|tail|middle):(\d+)$/;
    const match = mode.match(modePattern);
    
    if (!match) {
      throw new Error('Invalid mode format. Use "head:<n>", "tail:<n>", "full", or "middle:<n>"');
    }

    const [, command, numberStr] = match;
    const number = parseInt(numberStr, 10);

    if (number <= 0) {
      throw new Error('Number of lines must be greater than 0');
    }

    return { command, number };
  }

  /**
   * Read logs from the hardcoded log file with specified mode
   */
  async readLogs(mode) {
    try {
      console.log('[MCP Server] Reading logs with mode:', mode);

      // Parse the mode
      const { command, number } = this.parseMode(mode);

      // Check if file exists
      try {
        await fs.access(LOG_FILE_PATH);
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                mode,
                logFilePath: LOG_FILE_PATH,
                error: `Log file not found: ${LOG_FILE_PATH}`,
                lines: [],
              }, null, 2),
            },
          ],
        };
      }

      // Get file stats to check size
      const stats = await fs.stat(LOG_FILE_PATH);
      const fileSizeInMB = stats.size / (1024 * 1024);

      // For very large files (>100MB), we might want to use streams
      // But for simplicity and as requested, we'll read the full content and process
      if (fileSizeInMB > 100) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                mode,
                logFilePath: LOG_FILE_PATH,
                error: `File too large (${fileSizeInMB.toFixed(2)}MB). Maximum supported size is 100MB.`,
                lines: [],
              }, null, 2),
            },
          ],
        };
      }

      // Read the file content
      const fileContent = await fs.readFile(LOG_FILE_PATH, 'utf8');
      const allLines = fileContent.split('\n');
      
      // Remove the last empty line if it exists (common when files end with newline)
      if (allLines.length > 0 && allLines[allLines.length - 1] === '') {
        allLines.pop();
      }

      let resultLines = [];

      // Process based on command
      switch (command) {
        case 'full':
          resultLines = allLines;
          break;

        case 'head':
          resultLines = allLines.slice(0, number);
          break;

        case 'tail':
          resultLines = allLines.slice(-number);
          break;

        case 'middle':
          const totalLines = allLines.length;
          if (totalLines === 0) {
            resultLines = [];
          } else if (number >= totalLines) {
            // If requested lines >= total lines, return all lines
            resultLines = allLines;
          } else {
            // Calculate middle position
            const startIndex = Math.floor((totalLines - number) / 2);
            resultLines = allLines.slice(startIndex, startIndex + number);
          }
          break;

        default:
          throw new Error(`Unsupported command: ${command}`);
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              mode,
              logFilePath: LOG_FILE_PATH,
              totalLines: allLines.length,
              returnedLines: resultLines.length,
              lines: resultLines,
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              mode,
              logFilePath: LOG_FILE_PATH,
              error: error.message,
              lines: [],
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Retrieve all existing tasks of the current session
   */
  async listTasks(sessionId) {
    try {
      console.log('[MCP Server] Listing tasks for session:', sessionId);

      const tasks = await this.getTasksFromDB(sessionId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              session_id: sessionId,
              total_tasks: tasks.length,
              tasks: tasks
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in listTasks:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              session_id: sessionId,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Add a new task to the current session's list
   */
  async addTask(sessionId, title, description = '') {
    try {
      console.log('[MCP Server] Adding task to session:', sessionId);

      const taskId = uuidv4();
      const task = await this.createTaskInDB(taskId, sessionId, title, description);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: true,
              task_id: taskId,
              task: task
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in addTask:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              session_id: sessionId,
              title: title,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Remove a task from the list by its task_id
   */
  async removeTask(taskId) {
    try {
      console.log('[MCP Server] Removing task:', taskId);

      const success = await this.deleteTaskFromDB(taskId);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: success,
              task_id: taskId,
              message: success ? 'Task removed successfully' : 'Task not found'
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in removeTask:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              task_id: taskId,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Mark a task as completed
   */
  async completeTask(taskId) {
    try {
      console.log('[MCP Server] Completing task:', taskId);

      const success = await this.updateTaskStatusInDB(taskId, 'completed');

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: success,
              task_id: taskId,
              status: 'completed',
              message: success ? 'Task marked as completed' : 'Task not found'
            }, null, 2),
          },
        ],
      };

    } catch (error) {
      console.error('[MCP Server] Error in completeTask:', error);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              success: false,
              task_id: taskId,
              error: error.message
            }, null, 2),
          },
        ],
      };
    }
  }

  /**
   * Create a task in the database
   */
  async createTaskInDB(taskId, sessionId, title, description) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO tasks (task_id, session_id, title, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
      `;

      this.db.run(sql, [taskId, sessionId, title, description], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({
            task_id: taskId,
            session_id: sessionId,
            title: title,
            description: description,
            status: 'pending',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });
    });
  }

  /**
   * Get all tasks for a session from database
   */
  async getTasksFromDB(sessionId) {
    return new Promise((resolve, reject) => {
      const sql = `
        SELECT task_id, session_id, title, description, status, created_at, updated_at
        FROM tasks
        WHERE session_id = ?
        ORDER BY created_at ASC
      `;

      this.db.all(sql, [sessionId], (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows || []);
        }
      });
    });
  }

  /**
   * Delete a task from database
   */
  async deleteTaskFromDB(taskId) {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM tasks WHERE task_id = ?';

      this.db.run(sql, [taskId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  /**
   * Update task status in database
   */
  async updateTaskStatusInDB(taskId, status) {
    return new Promise((resolve, reject) => {
      const sql = `
        UPDATE tasks 
        SET status = ?, updated_at = datetime('now')
        WHERE task_id = ?
      `;

      this.db.run(sql, [status, taskId], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve(this.changes > 0);
        }
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Server] Backend MCP Server running on stdio');
  }
}

// Start the server
const server = new CurlMCPServer();
server.run().catch((error) => {
  console.error('[MCP Server] Failed to start server:', error);
  process.exit(1);
});