#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { exec, spawn } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

// Hardcoded Bearer Token - In production, this should be configurable
const BEARER_TOKEN = 'your-bearer-token-here';

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

    this.setupToolHandlers();
    this.setupErrorHandling();
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
      const logFile = args.logFile || 'C:\\logs\\node-output.log';
      const errorLogFile = args.errorLogFile || 'C:\\logs\\node-error.log';

      console.log('[MCP Server] Restarting Node.js process...');
      console.log('[MCP Server] Entrypoint:', entrypoint);
      console.log('[MCP Server] Log file:', logFile);
      console.log('[MCP Server] Error log file:', errorLogFile);

      // Step 1: Kill any process using port 3000
      const killCommand = `$pid = (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess; if ($pid) { Stop-Process -Id $pid -Force; Write-Output "Killed process $pid" } else { Write-Output "No process found on port 3000" }`;
      
      const killResult = await this.executePowerShellCommand(killCommand);
      console.log('[MCP Server] Kill command result:', killResult);

      // Step 2: Start a new Node.js process
      const startCommand = `Start-Process node "${entrypoint}" -RedirectStandardOutput "${logFile}" -RedirectStandardError "${errorLogFile}" -NoNewWindow; Write-Output "Started new Node.js process"`;
      
      const startResult = await this.executePowerShellCommand(startCommand);
      console.log('[MCP Server] Start command result:', startResult);

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
                output: startResult.stdout,
                error: startResult.stderr,
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