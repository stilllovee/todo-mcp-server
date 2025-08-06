const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');

const { SERVER_CONFIG } = require('../config/constants');
const { TaskDatabase } = require('../database/sqlite');
const { executeCurl } = require('../tools/curl');
const { restartNodeProcess } = require('../tools/process');
const { readLogs } = require('../tools/logs');
const { generateRandomString } = require('../tools/utils');
const { TaskManager } = require('../tools/tasks');

class CurlMCPServer {
  constructor() {
    this.server = new Server(
      SERVER_CONFIG,
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Initialize database and task manager
    this.database = new TaskDatabase();
    this.taskManager = new TaskManager(this.database);

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
          // {
          //   name: 'restart_node_process',
          //   description: 'Kill any process using port 3000 and start a new Node.js process in the background',
          //   inputSchema: {
          //     type: 'object',
          //     properties: {
          //       entrypoint: {
          //         type: 'string',
          //         description: 'Path to the Node.js entrypoint file (optional, uses hardcoded default)',
          //       },
          //       logFile: {
          //         type: 'string',
          //         description: 'Path to the log file (optional, uses hardcoded default)',
          //       },
          //       errorLogFile: {
          //         type: 'string',
          //         description: 'Path to the error log file (optional, uses hardcoded default)',
          //       },
          //     },
          //     required: [],
          //   },
          // },
          // {
          //   name: 'read_logs',
          //   description: 'Read logs from a hardcoded log file with different modes (head, tail, full, middle)',
          //   inputSchema: {
          //     type: 'object',
          //     properties: {
          //       mode: {
          //         type: 'string',
          //         description: 'Reading mode: "head:<n>" (first n lines), "tail:<n>" (last n lines), "full" (entire file), "middle:<n>" (n lines from middle)',
          //       },
          //     },
          //     required: ['mode'],
          //   },
          // },
          {
            name: 'generate_random_string',
            description: 'Generate a random 6-character alphanumeric string',
            inputSchema: {
              type: 'object',
              properties: {},
              required: [],
            },
          },
          // {
          //   name: 'list',
          //   description: 'Retrieve all existing tasks of the current session.',
          //   inputSchema: {
          //     type: 'object',
          //     properties: {
          //       session_id: {
          //         type: 'string',
          //         description: 'The session identifier for the task, generated randomly string and passed by the Agent',
          //       },
          //     },
          //     required: ['session_id'],
          //   },
          // },
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
          // {
          //   name: 'remove',
          //   description: 'Remove a task from the list by its task_id.',
          //   inputSchema: {
          //     type: 'object',
          //     properties: {
          //       task_id: {
          //         type: 'string',
          //         description: 'The unique identifier of the task to remove',
          //       },
          //     },
          //     required: ['task_id'],
          //   },
          // },
          // {
          //   name: 'complete',
          //   description: 'Mark a task as completed.',
          //   inputSchema: {
          //     type: 'object',
          //     properties: {
          //       task_id: {
          //         type: 'string',
          //         description: 'The unique identifier of the task to mark as completed',
          //       },
          //     },
          //     required: ['task_id'],
          //   },
          // },
          {
            name: 'next',
            description: 'Returns next pending task. On subsequent calls, marks previously returned task as completed and returns next pending task.',
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
        ],
      };
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      if (name === 'execute_curl') {
        return await executeCurl(args.command);
      }

      if (name === 'restart_node_process') {
        return await restartNodeProcess(args);
      }

      if (name === 'read_logs') {
        return await readLogs(args.mode);
      }

      if (name === 'generate_random_string') {
        return await generateRandomString();
      }

      if (name === 'list') {
        return await this.taskManager.listTasks(args.session_id);
      }

      if (name === 'add') {
        return await this.taskManager.addTask(args.session_id, args.title, args.description);
      }

      if (name === 'remove') {
        return await this.taskManager.removeTask(args.task_id);
      }

      if (name === 'complete') {
        return await this.taskManager.completeTask(args.task_id);
      }

      if (name === 'next') {
        return await this.taskManager.nextTask(args.session_id);
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
      if (this.database) {
        this.database.close();
      }
      process.exit(0);
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('[MCP Server] Backend MCP Server running on stdio');
  }
}

module.exports = {
  CurlMCPServer,
};